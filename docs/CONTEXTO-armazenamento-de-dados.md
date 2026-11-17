# Armazenamento de dados: caderno central

O problema central do 33moody: **gravar sempre** o que o robô faz, numa frota em rede industrial, de forma leve, e ainda assim reconstruir o momento com fidelidade suficiente para diagnosticar. Gravar tudo (rosbag completo) é pesado demais; gravar só por evento perde o "antes" do incidente.

Este arquivo junta **toda** descoberta, conta e conclusão sobre isso. Regra: cada entrada diz a data e se é **estimativa** (conta no papel) ou **medição** (número real de um bag ou do gravador).

---

## 1. Tese do diferencial

> Gravação sempre ligada, com **X % do tamanho** de um rosbag e **erro máximo conhecido**, com replay visual no navegador.

A ideia vem dos **historians industriais** (indústria de processo), que comprimem séries temporais com erro máximo garantido. A novidade é aplicar isso a robôs ROS 2 e reconstruir a cena 3D a partir do **estado** gravado, não dos sensores brutos.

X e o erro ainda **não foram medidos**. A prova planejada: gravar o TurtleBot3 + Nav2 em MCAP (a "verdade"), passar os mesmos dados pelo gravador comprimido e sobrepor os dois replays no 33moody, mostrando o tamanho e o erro lado a lado.

## 2. De onde vem o volume (estimativas, 2026-11-17)

Contas feitas com o tamanho das mensagens ROS 2 serializadas (CDR), sem compressão. **Conferir no passo 2** com `ros2 bag info` e com o MCAP real.

| Tópico | Tamanho aprox. por msg | Taxa típica | Por hora | Observação |
|---|---|---|---|---|
| `/scan` (360 feixes, ranges + intensities float32) | ~2,9 KB | 5 Hz (TB3) | **~52 MB** | Metade é `intensities`, muitas vezes inútil para diagnóstico |
| `/odom` (nav_msgs/Odometry) | ~0,7 KB | 20–50 Hz | ~50–125 MB | **~576 B são as duas matrizes de covariância 6×6 em float64**, quase sempre constantes |
| `/tf` | ~0,1–0,2 KB por transform | 30–100 Hz | dezenas de MB | Muito redundante: a maioria dos frames é fixa (vai no `/tf_static`) |
| `/map` 384×384 | ~147 KB | latched / raro | pequeno se gravado 1 vez | Gravar só quando mudar |
| costmaps (global/local) | 10–500 KB | 1–5 Hz | **centenas de MB a GB** | Um dos maiores vilões; repetem quase tudo entre mensagens |
| câmera crua 640×480 RGB | ~920 KB | 30 Hz | **~100 GB** | Fora do historian; no máximo como "caixa-preta" por evento |
| `/cmd_vel`, bateria, estados do Nav2 | < 100 B | 1–20 Hz | < 10 MB | Barato; **sempre** gravar |

### 2.1 Medição real: TurtleBot3 Waffle + Nav2 na simulação (2026-11-17)

Medido com `ros2 topic bw` na simulação `nav2_bringup tb3_simulation_launch.py`, com o robô navegando. Bytes da mensagem serializada (CDR), sem compressão.

**Atenção:** é tempo de simulação. O Gazebo rodou um pouco abaixo do tempo real (o `/scan`, nominal de 5 Hz, chegou a ~4 Hz no relógio de parede); num robô real as taxas tendem a ser as nominais, um pouco maiores.

| Tópico | Tamanho medido | Banda medida | Por hora (estimado) |
|---|---|---|---|
| `/global_costmap/costmap` | **147,6 KB** | **~148 KB/s** (~1 Hz) | **~530 MB** |
| `/imu` | 0,32 KB | ~48 KB/s (~150 Hz) | ~175 MB |
| `/joint_states` | — | ~33 KB/s | ~120 MB |
| `/odom` | 0,72 KB | ~17 KB/s (~20–30 Hz) | ~63 MB |
| `/scan` | 2,94 KB | ~11,6 KB/s (~4 Hz) | ~42 MB |
| `/local_costmap/costmap` | 3,7 KB | ~7 KB/s (~2 Hz) | ~25 MB |
| `/tf` | 0,11–0,21 KB | ~4,9 KB/s | ~18 MB |

**Total só destes tópicos: ~270 KB/s, ou seja ~1 GB por hora por robô**, sem câmera nem nuvem de pontos.

**Conclusões da medição:**
- **O global costmap sozinho é mais da metade do volume.** Ele republica o mapa inteiro (384×384 células) a cada segundo, quase igual de uma vez para outra. Gravar só as mudanças (`/global_costmap/costmap_updates`) ou nem gravar (dá para reconstruir a partir do mapa + scan) é o maior ganho isolado.
- **`/imu` e `/joint_states` não estavam no radar** e juntos são ~30 % do volume. Para o diagnóstico de navegação, a IMU a 150 Hz raramente importa; uma política "deadband" ou decimação para ~10 Hz resolve.
- O estimado do `/scan` (2,9 KB por msg) **bateu** com a medição.
- O `/odom` (0,72 KB) também bateu: a maior parte são as covariâncias.
- O que explica um incidente (pose, `cmd_vel`, estados do Nav2, `/amcl_pose`) é uma fração mínima do total.

**Conclusões iniciais (estimativas):**
- Os dados que explicam um incidente (pose, velocidades, comandos, estados, erros) são **pequenos**. Os pesados são os sensores brutos (scan, nuvem, câmera) e os costmaps.
- Muito do volume é **redundância**: covariância constante, frames fixos, mapas repetidos, robô parado gerando a mesma pose a 50 Hz.

## 3. Caixa de ferramentas

### Sem perda (bits idênticos)
- **Compressão de chunk do MCAP** (zstd/lz4). No rosbag2 com o storage MCAP: `ros2 bag record -s mcap --storage-preset-profile zstd_fast` (ou `zstd_small`). Ganho bom em dados repetitivos; não muda o que é gravado.
- **Gravar só quando muda:** `/map`, parâmetros, estados discretos (modo do Nav2, erros).
- **Descartar campos constantes:** covariância, `frame_id` repetido; reconstruir na leitura.

### Com perda controlada (erro máximo garantido)
- **Deadband:** só grava quando o valor sai de ± tolerância em torno do último gravado (bateria, temperatura).
- **Swinging door:** só grava quando uma **reta** entre pontos deixa de representar o sinal dentro da tolerância. Ótimo para sinais que variam de forma suave.
- **Dead reckoning na pose:** grava quando a pose real se afasta da prevista pela última velocidade conhecida. Uma reta a velocidade constante vira 2 pontos em vez de milhares.
- **Quantização:** ex.: posição em cm como int32 em vez de float64.
- **Decimação por tópico:** ex.: scan a 1 Hz no historian, em vez de 5 Hz.

### Por política de tempo
- **Buffer circular de alta resolução:** os últimos N minutos com tudo (MCAP completo) ficam no robô; num incidente, congela e envia. Garante o "antes" detalhado.
- **Retenção em camadas:** resolução total por pouco tempo e versão comprimida por muito tempo (ex.: agregados contínuos do TimescaleDB no servidor).
- **Store-and-forward:** grava local e envia quando a rede permite (rede industrial instável).

## 4. Consequências para a arquitetura (decisões)

- **Política por tópico no perfil do robô**, fora do código: tolerância, modo (sempre, ao mudar, deadband, swinging door, dead reckoning, só no buffer) e taxa máxima.
- **O replay precisa reconstruir, não só buscar.** Hoje `DataSource.messageAt(t)` devolve a última mensagem até `t` (degrau). Com dados comprimidos, a reconstrução **tem que interpolar** de forma coerente com o compressor: lerp na posição, slerp no ângulo, degrau nos estados discretos. Isso fica no `packages/replay-engine` (a criar), não na UI.
- **O erro tem que aparecer na tela:** o replay mostra o erro máximo daquele trecho. É a resposta para "dá para confiar?".
- **Separar estado de sensor:** o historian guarda estado sempre; scan, nuvem e câmera vão só para o buffer circular ou para gravação por evento.

## 5. Métricas a medir (para a prova de conceito)

Para cada tópico e no total: **bytes por hora** (MCAP cru × MCAP com zstd × historian), **taxa de compressão**, **erro máximo e RMS** da pose reconstruída (cm, graus), **CPU e memória** do gravador no robô, **banda** necessária para o envio.

## 6. Diário de descobertas

- **2026-11-17**: estimativas da seção 2. Hipótese principal: covariâncias, `/tf` e costmaps são o maior desperdício; pose, comandos e estados cabem em poucos MB por hora. *A medir no passo 2.*
- **2026-11-17**: o contrato `messageAt` atual é "última mensagem até t" (degrau). Serve para o demo e para MCAP completo, mas o historian comprimido vai exigir interpolação no replay-engine.
- **2026-11-17 (medição)**: ~1 GB/h por robô na simulação TB3 + Nav2, com o global costmap respondendo por mais da metade (seção 2.1).
- **2026-11-17**: **relógio da simulação ≠ relógio de parede.** Com `use_sim_time`, o `header.stamp` começa em 0 quando o Gazebo liga. Ao vivo, o 33moody usa o instante de chegada; mas **toda gravação precisa guardar os dois tempos** (stamp do robô e relógio de parede), senão o replay não acha o horário real do incidente. Num robô real o problema vira dessincronia de relógio (NTP/chrony).
- **2026-11-17**: o `/tf` vem "picado": cada mensagem traz só parte da árvore (a odometria publica `odom → base_footprint` a ~30 Hz; o AMCL publica `map → odom` em outro ritmo). Para o replay da pose, gravar `map → base_footprint` já composto, a uma taxa baixa com dead reckoning, é muito mais barato que regravar o `/tf` inteiro.
- **2026-11-17**: frames fixos (`/tf_static`, ~15 no Waffle) chegam UMA vez. Gravar uma vez por sessão.

