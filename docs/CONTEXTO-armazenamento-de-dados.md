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

### 2.2 Medição real: arquivo MCAP com TODOS os tópicos (2026-11-17)

Mesma simulação, robô vagando (`tools/sim/wander.py`), `ros2 bag record -a -s mcap` por 148 s, gravado **duas vezes ao mesmo tempo**: sem compressão e com `--storage-preset-profile zstd_fast`. Medido com `node tools/mcap/bag-stats.mjs <arquivo>`.

| | No disco | Por hora |
|---|---|---|
| Sem compressão | 132,2 MB | **~3,0 GB/h** |
| zstd_fast (sem perda) | 19,6 MB | **~480 MB/h** (6,7× menor) |

Por tópico (sem compressão), os maiores:

| Tópico | Hz | Bytes/msg | MB/h | % |
|---|---|---|---|---|
| 6 tópicos do global costmap (`costmap`, `costmap_raw`, `static_layer`, `static_layer_raw`, `obstacle_layer`, `obstacle_layer_raw`) | 0,6 cada | ~147 600 | ~295 cada, **~1 770 juntos** | **59 %** |
| `/local_costmap/voxel_grid` | 5,0 | 14 480 | 247 | 8,2 |
| `/particle_cloud` (AMCL) | 1,2 | 54 276 | 228 | 7,6 |
| `/imu` | 192 | 324 | 214 | 7,1 |
| `/joint_states` | 320 | 140 | 154 | 5,1 |
| `/bond` (heartbeat do lifecycle do Nav2) | 238 | 92 | 76 | 2,5 |
| `/odom` | 26,7 | 724 | 66 | 2,2 |
| `/scan` | 4,8 | 2 944 | 49 | 1,6 |
| `/tf` | 50,4 | 145 | 25 | 0,8 |
| `/clock` | 320 | 12 | 13 | 0,4 |
| `/map` | 1 msg | 147 560 | — | 0,1 |

**Conclusões:**
- **Gravar "tudo" (`-a`) é a pior escolha:** ~3 GB/h por robô, e 59 % disso são **seis cópias do mesmo mapa de custo** (o final, a versão `_raw` e cada camada).
- **O que o replay do 33moody usa hoje** (`/tf`, `/tf_static`, `/odom`, `/scan`, `/map`, `/cmd_vel`) soma **~140 MB/h sem compressão, ~4,6 % do total**. Só escolher os tópicos certos já reduz ~20×, antes de qualquer compressão.
- **zstd sem perda reduz 6,7×** nessa mistura (dados repetitivos comprimem bem). Escolher os tópicos e depois aplicar zstd deve ficar na casa de **dezenas de MB/h**. *A medir.*
- Tópicos que parecem pequenos pesam pela FREQUÊNCIA: `/joint_states` (320 Hz), `/bond` (238 Hz), `/clock` (320 Hz).
- Taxas medidas no relógio de parede com a simulação um pouco abaixo do tempo real.

### 2.3 Medição real: gravações do ROBÔ REAL da empresa parceira (2026-11-17)

8 MCAPs (ROS 2 Jazzy) de 05/11 e 09/11/2026, em `recordings/rosbags/` (fora do git). Já gravados com **seleção de tópicos** (11–14 tópicos), mas **sem compressão**. Medido com `tools/mcap/bag-stats.mjs`.

| Gravação | Duração | Tamanho | Por hora |
|---|---|---|---|
| 05/11 14:55:58 | 55 s | 137 MB | **8,9 GB/h** |
| 09/11 10:19:42 | 71 s | 169 MB | **8,5 GB/h** |
| 09/11 16:23:42 | 371 s | 861 MB | ~8,4 GB/h |

Por tópico (09/11 10:19:42):

| Tópico | Hz | Bytes/msg | MB/h | % |
|---|---|---|---|---|
| `/global_costmap/costmap` | 0,9 | **2 218 626** | **7 055** | **82,8** |
| `/particle_cloud` | 2,7 | 72 314 | 669 | 7,8 |
| `/scan` (2170 feixes, 360°) | 9,9 | 17 424 | 593 | 7,0 |
| `/map` (1814×1223 células, 91×61 m) | 1 msg | 2 218 626 | — | 1,3 |
| `/odom` | 20 | 724 | 50 | 0,6 |
| `/tf` | 40 | 128 | 18 | 0,2 |
| `/amcl_pose`, `/cmd_vel`, `/wheel_readings`, `/diagnostics` | 3–20 | 52–368 | 3–4 cada | < 0,1 cada |

**Conclusões (dado real):**
- **~8,5–8,9 GB por hora por robô**, mesmo escolhendo tópicos. Uma frota de 10 robôs em 2 turnos daria ~1,4 TB/dia.
- **O global costmap é 75–83 % de tudo**: num mapa de armazém (91 × 61 m), cada mensagem tem 2,2 MB, republicada ~1×/s quase igual. Não gravar o costmap inteiro (ou gravar só as mudanças / reconstruir do mapa + scan) resolve sozinho a maior parte do problema.
- O `/particle_cloud` (nuvem do AMCL) vem em segundo; útil só em diagnóstico de localização, ou seja, candidato a gravar só por evento.
- **O que explica um incidente** (`/odom`, `/tf`, `/amcl_pose`, `/cmd_vel`, rodas, diagnósticos) soma **< 1 %** do volume.
- **Metade das gravações tem relógio zerado** (logTime ~800 s → "1969"): o gravador não estava com o relógio real. O historian precisa gravar o relógio de parede de forma garantida (e marcar quando ele não for confiável).
- **Uma gravação (`05_11_2026/15_20_19`) está cortada** (sem rodapé/índice, termina em `ff ff…`, sem `metadata.yaml`): o robô parou no meio. A gravação do momento do problema é a que mais corre risco: o formato do historian tem que sobreviver a desligamento abrupto (escrever em blocos fechados, nunca depender de um índice no fim).

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
- **2026-11-17 (medição)**: **todo sensor tem que ser reconstruído com a pose do instante da medição** (`header.stamp`), não a do momento em que é exibido. Com o robô vagando (giros de 0,9 rad/s), posicionar o scan pela pose "de agora" deu erro médio de 3,5 cm até a parede (p95 10,2 cm); pela pose no stamp via tf2, 1,4 cm (p95 2,4 cm), em 90 scans. Consequência para o historian: **guardar o `header.stamp` de cada medição e um histórico de pose denso o bastante para interpolar nesse instante**. Uma pose comprimida (dead reckoning) serve, desde que o replay interpole no stamp do sensor.
- **2026-11-17 (medição)**: MCAP real com todos os tópicos: 3,0 GB/h cru, 480 MB/h com zstd; 59 % são as 6 cópias do global costmap (seção 2.2).
- **2026-11-17**: o eixo de tempo do replay é o `logTime` do MCAP (relógio de PAREDE do gravador). O `header.stamp` (tempo de simulação) fica dentro das mensagens e é ele que o TF usa. Os dois relógios convivem no mesmo arquivo; o historian precisa guardar os dois.
- **2026-11-17**: abrir o MCAP de 19,6 MB (124 MB descomprimidos) levou ~9 s no Chrome de teste, que é lento (sem GPU). Ler e descomprimir o arquivo inteiro na thread da UI não escala: para arquivos grandes, ler sob demanda pelo índice do MCAP, num Web Worker.
- **2026-11-17 (medição)**: o `/scan` da simulação manda as 360 `intensities` **sempre zeradas**: 1,4 KB de zeros por mensagem, metade dos 2,9 KB. Num robô real o LiDAR pode ou não preencher o campo; se não preencher, é o primeiro candidato a não gravar (ou o zstd o reduz a quase nada).
- **2026-11-17 (medição)**: **toda gravação começa "cega".** Neste MCAP: `/tf` em +98 ms, `/scan` em +1077 ms, `/amcl_pose` em +1366 ms, `/map` em +1411 ms. O `map → odom` só aparece quando o AMCL processa o primeiro scan (~+1,4 s). Até lá não há mapa nem robô localizado. Consequência para o historian: **cada arquivo/bloco gravado deve começar com um "retrato do estado"** (último `/map`, `/tf_static`, último `map → odom` e o estado dos nós), senão o começo de cada trecho fica sem contexto. É o equivalente a um "keyframe" de vídeo.
- **2026-11-17 (validação)**: o replay do 33moody bateu **exatamente** com o leitor oficial `rosbag2_py` em `/amcl_pose`, `/cmd_vel` e `/scan` (valores e stamps), comparando a mesma regra "última mensagem até t".
- **2026-11-17**: o AMCL do Nav2 publica `map → odom` com o stamp **~1 s no futuro** (`transform_tolerance: 1.0`) e só atualiza depois de 0,25 m ou 0,2 rad. O replay precisa reproduzir isso como é (é comportamento real da localização), e não "corrigir".

