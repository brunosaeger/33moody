# 33moody: especificação de interface e arquitetura (v0.1)

> Status: **proposta para aprovação**. Nada implementado ainda.
> Origem: diálogo de UX de 2026-11-10 (ver o documento de contexto do projeto).

---

## 1. Visão

O 33moody é uma plataforma web de **diagnóstico e monitoramento pontual** de robôs. Ela não é uma ferramenta de controle de frota.

O fluxo típico tem dois tempos:

1. **Investigar (replay):** reconstruir o que o robô fez numa faixa de horário passada, a partir do *historian* (estado gravado, sem vídeo).
2. **Acompanhar (ao vivo):** com a correção aplicada, ver o robô ao vivo em 3D, com os sensores ligados.

A meta é igualar ou superar o RViz em funções de diagnóstico, com UX melhor, rodando no navegador e com replay.

## 2. Princípios de UX (regras fixas)

| Regra | Consequência no código |
|---|---|
| **Tela única.** Fora um eventual login, o usuário nunca sai da tela. | Não há router de páginas. Tudo são o menu lateral, popovers e overlays. |
| **Estilo Photoshop:** tudo o que você precisa está na tela. | Layout fixo: viewport + um menu lateral direito com abas. |
| **Só desktop.** | Largura mínima de 1280 px, sem layout mobile. |
| **Assinatura visual LIFTYMapper.** | Tokens de tema compartilhados entre CSS e Three.js; escuro por padrão. |
| **Nada específico do robô no código.** | Tópicos, componentes, frames e modelo vêm de configuração. |

## 3. Layout (revisado em 2026-11-10)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 33moody                                              (header, vazia v1)  │
├──────────────────────────────────────────────┬┬──────────────────────────┤
│                                              ││ Camadas │ Componentes  + │
│                                              ││──────────────────────────│
│                VIEWPORT 3D                   ││ ┌──────────┐┌──────────┐ │
│                (o "RViz")                    ⇔│ │/battery  ││/scan     │ │
│                                              ││ │ 48.2 V   ││ 10.0 Hz  │ │
│                                              ││ └──────────┘└──────────┘ │
├──────────────────────────────────────────────┴┴──────────────────────────┤
│ ╭──────────────────────────────────────────────────────────────────────╮ │
│ │ |····|····|····|····|····|▼···|····|····|····|····|····|····|····|  │ │
│ │ 14:50     14:55     15:00   ↑cursor   15:10     15:15     15:20      │ │
│ ╰──────────────────────────────────────────────────────────────────────╯ │
│        ⏮  ⏯  ⏭      «1 «5 «10 «30 «x     1» 5» 10» 30» x»                │
│              📅  [ 2026-11-10 14:50:00 ] → [ 2026-11-10 15:20:00 ]       │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Um único menu lateral, sempre à direita**, com abas (por enquanto **Camadas** e **Componentes**). As abas se alternam, mas não podem ser arrastadas, soltas nem trocar de lado.
- A **largura** do menu é ajustável arrastando o divisor (⇔). Ela vai de 260 a 900 px, e o viewport nunca fica com menos de 480 px. Duplo clique no divisor volta ao padrão de 340 px; as setas do teclado também ajustam.
- **Só os componentes** dentro da aba Componentes podem ser reorganizados e redimensionados.
- A largura, a aba ativa e os componentes ficam salvos no navegador.
- *Histórico:* a v0.1 tinha janelas ancoráveis e flutuantes (dockview). Elas foram descartadas em favor desse layout fixo, mais simples.

## 4. Elementos da tela

### 4.1 Header
- O título **33moody** fica à esquerda ("33" em `#f5522a`, Arial Black).
- O resto fica vazio na v1 e vai crescer conforme o uso. Candidatos naturais: robô ativo, indicador AO VIVO/REPLAY, presets de layout e tema claro/escuro.

### 4.2 Viewport 3D
Tem três estados:

| Estado | O que aparece |
|---|---|
| **Desconectado** | Cartão "Conecte um robô" no centro, com um formulário (nome, endereço/VPN, perfil do robô). Na v1 há um botão **"Demo"**, que carrega um dataset de exemplo. |
| **Ao vivo** | A cena 3D com os dados chegando em tempo real. |
| **Replay** | A mesma cena 3D, com os dados reconstruídos para o instante do cursor. |

**Câmera:**
- O movimento é livre (orbitar, mover e dar zoom com o mouse).
- Presets: **Orbital**, **Seguir robô** e **Vista de cima (2D)**.
- **Fixed frame** configurável (`map`, `odom`, …), como no RViz.

### 4.3 Camadas (displays do RViz)
Cada camada pode ser ligada e desligada e tem as próprias configurações (cor, tamanho, tópico, decaimento…). Elas ficam listadas na aba **Camadas** do menu lateral.

| Camada | Mensagem ROS2 típica | v1 |
|---|---|---|
| Mapa | `nav_msgs/OccupancyGrid` | ✅ (opcional, se houver mapa) |
| Modelo do robô | URDF (caixa simples como fallback) | ✅ |
| TF | `tf2_msgs/TFMessage` | ✅ |
| LaserScan | `sensor_msgs/LaserScan` | ✅ |
| Plano global/local | `nav_msgs/Path` | ✅ |
| Rastro da trajetória | derivado da pose | ✅ |
| `cmd_vel` × velocidade medida | `geometry_msgs/Twist` + `nav_msgs/Odometry` | ✅ |
| Costmap | `nav_msgs/OccupancyGrid` | fase 2 |
| Nuvem de pontos | `sensor_msgs/PointCloud2` | fase 2 |
| Markers | `visualization_msgs/MarkerArray` | fase 2 |
| Câmera | `sensor_msgs/(Compressed)Image` | fase 3 |

### 4.4 Aba Componentes (revisado em 2026-11-10)
- O botão **+** (no fim da barra de abas, visível só nesta aba) lista os **tópicos** da fonte ativa (ex.: `/battery_state`, com o tipo `sensor_msgs/BatteryState`).
- Escolher um tópico cria um **componente**: um quadradinho **arrastável** (pelo cabeçalho) e **redimensionável** (pelo canto), numa grade que acompanha a largura do menu.
- O componente mostra:
  - no cabeçalho, o tópico, o tipo e a **frequência medida** (Hz);
  - no corpo, a árvore de campos e valores da última mensagem, atualizada a 10 Hz;
  - arrays grandes resumidos (ex.: `ranges [360] mín 0.41 · máx 5.12`).
- Os valores mostrados são os do **instante atual da timeline**, seja ao vivo ou no replay.
- **Futuro:**
  - o perfil do robô (YAML) poderá trazer componentes prontos;
  - clicar num valor abrirá o gráfico da faixa inteira;
  - estados discretos aparecerão como badges coloridos;
  - widgets especializados por tipo de mensagem (ex.: medidor de bateria em vez da árvore crua).

### 4.5 Timeline (protótipo implementado em 2026-11-10)
- **Só aparece com um robô conectado.** Ela fica no rodapé, abaixo do viewport e do menu lateral.
- **Barra:** um retângulo arredondado com régua de traços. O passo se ajusta à escala (1 s até 12 h) e fica alinhado ao relógio local.
  - **Ao vivo:** mostra os últimos 10 min, com o marcador ciano **AGORA** na ponta direita.
  - **Replay:** a faixa escolhida aparece entre **dois marcadores vermelhos** (início e fim), com folga de 5 % dos lados. O **cursor em seta** (âmbar, com a hora) é arrastado; clicar em qualquer ponto da barra também move o cursor até lá.
- **Controles (centro):**
  - **skips** para trás e para frente, com o número embaixo de cada botão: 1, 5, 10, 30 e *x* segundos (o *x* é editável);
  - **⏯** play/pause (o play no fim da faixa recomeça do início);
  - **velocidade**: 0.25× a 8×;
  - arrastar o cursor pausa a reprodução.
- **Esquerda:** o relógio grande com a hora mostrada, a data e, no replay, a posição dentro da faixa (`01:42 / 10:00`).
- **Direita:** o selo **● AO VIVO** (piscando) ou o botão **Voltar ao vivo**.
- **Faixa (abaixo):** 📅 abre o calendário nativo; ao lado ficam os campos de início e fim (com segundos) e o botão **Ver replay** (Enter também confirma).
  - Os campos vêm preenchidos com os últimos 10 min.
  - Validação: o fim precisa ser depois do início, a faixa não pode estar no futuro e o máximo é 24 h. Um fim no futuro é cortado no "agora".
- **Componentes no replay:** mostram a mensagem do instante do cursor, com o selo **REPLAY** no lugar da frequência em Hz.
- **Robô demo:** no replay recebe uma "agitação" artificial, determinística, para a variação ficar visível na demonstração. Ao vivo varia pouco. Isso existe só no demo.
- **Arquitetura:**
  - o relógio da sessão fica em `src/data/clockStore.ts` (modo, faixa, cursor, play, velocidade);
  - a reconstrução usa a capacidade opcional `DataSource.messageAt(tópico, t)`, que a fonte de replay real (historian) também vai implementar.

## 5. Modelo mental do código (fronteiras entre módulos)

A decisão de arquitetura mais importante: **o viewport e o menu lateral não sabem se estão ao vivo ou em replay.** Eles só perguntam qual é o estado no instante `t`.

```
           ┌──────────────┐        ┌───────────────┐
           │  LiveSource  │        │ ReplaySource  │   ← fontes de dados (plugáveis)
           │ foxglove_ws  │        │ pacote replay │
           └──────┬───────┘        └───────┬───────┘
                  └──────────┬─────────────┘
                     interface DataSource
                             │
                   ┌─────────▼─────────┐
   Timeline ─────► │  Clock (t atual)  │   ← store global: modo, t, faixa, play/pause
                   └─────────┬─────────┘
                             │  estado(t)
              ┌──────────────┼───────────────┐
              ▼              ▼               ▼
       Camadas 3D     Janelas de comp.    Gráficos
     (registry de     (registry de        (registry)
      plugins)         widgets)
```

- **DataSource:** a interface comum (`channels()`, `stateAt(t)`, `subscribe()`). Ligar uma fonte nova (MQTT, MCAP local, servidor) é escrever um módulo novo, sem mexer no viewer.
- **Motor de replay:** é TypeScript puro, sem React. Faz a busca binária, a interpolação (lerp e slerp), os degraus dos estados discretos e o buffer de TF. Por ser isolado, dá para testar sozinho.
- **Registry de camadas:** cada camada é um módulo com `{ id, rótulo, tipos de mensagem aceitos, schema de configurações, componente 3D }`. Adicionar um display novo é registrar um arquivo, como os plugins do RViz.
- **Registry de widgets:** a mesma ideia, para os componentes da aba Componentes.
- **Perfil do robô:** o YAML com os componentes, canais, URDF e frames. É a única coisa que muda de um robô para outro.

## 6. Estrutura do repositório (monorepo)

```
33moody/
├── docs/                       especificações e decisões (ADRs)
├── apps/
│   ├── web/                    o viewer (React + r3f): só UI e composição
│   └── server/                 backend Node (fase posterior)
├── packages/
│   ├── protocol/               tipos do pacote de replay e do perfil do robô (TS)
│   ├── replay-engine/          motor de replay puro (TS, testado)
│   ├── data-sources/           LiveSource (foxglove ws), ReplaySource, DemoSource
│   ├── ros-msgs/               decodificação e helpers de mensagens ROS2
│   └── theme/                  tokens de cor e tipografia (CSS + JS para Three.js)
├── robot/                      workspace colcon (ROS2 Jazzy, C++)
│   └── src/
│       ├── moody_compression/  lib C++ pura: SwingingDoor, DeadReckoning (GoogleTest)
│       └── moody_recorder/     nó gravador (YAML de canais, store-and-forward)
├── config/
│   └── robots/                 perfis de robô (ex.: turtlebot4-sim.yaml)
└── tools/                      scripts (gerar dataset demo, converter bags…)
```

Dentro de `apps/web/src`, a organização é por **feature**, não por tipo de arquivo:

```
app/                composição da tela única (App.tsx, sidebarTabs.ts)
data/               sessão ativa (DataSource) e hooks de leitura
features/
  header/           barra superior (slots genéricos)
  viewport/         cena, câmera, estados (desconectado/ao vivo/replay)
  sidebar/          menu lateral direito: abas + largura ajustável
  layers/           aba Camadas: um arquivo ou pasta por camada + registry
  robot-components/ aba Componentes: quadro, componentes, botão +
  timeline/         barra, controles, seletor de faixa
  connection/       cartão "conecte o robô"
lib/                helpers de domínio sem UI (ex.: lib/ros)
shared/             UI básica (botões, menus, SplitPane), utilitários genéricos
```

## 7. Stack proposta

| Área | Escolha | Por quê |
|---|---|---|
| Linguagem web | **TypeScript** | Contratos claros entre os pacotes, essenciais com várias pessoas mexendo no código |
| Build | Vite | O mesmo do LIFTYMapper |
| Monorepo | npm workspaces | Já vem com o Node, sem ferramenta extra |
| 3D | three + @react-three/fiber + drei | Padrão do ecossistema |
| URDF | urdf-loader | Maduro |
| Layout | SplitPane próprio (`shared/ui`) | Viewport + menu lateral de largura ajustável; o dockview foi descartado com as janelas flutuantes |
| Grade de componentes | react-grid-layout | Componentes arrastáveis e redimensionáveis, como no Grafana |
| Estado global | zustand | Simples; funciona fora do React (o motor de replay e o r3f leem sem re-render) |
| Ao vivo | @foxglove/ws-protocol | Fala direto com o `foxglove_bridge` |
| MCAP / msgs | @mcap/core, @foxglove/rosmsg2-serialization | Leitura de bags e decodificação de mensagens |
| Gráficos | uPlot | Muito rápido para séries longas |
| Testes | Vitest (TS), GoogleTest (C++) | |
| Robô | C++17, ROS2 Jazzy, ament_cmake | |

## 8. Roadmap ajustado

| Fase | Entrega | Resultado visível |
|---|---|---|
| **0** | Monorepo, tema, shell da tela (header + viewport + menu lateral) | A "cara" do 33moody aberta no navegador |
| **1** ✅ | Viewport 3D (r3f, convenção ROS z-up) + câmera livre e presets (orbital, seguir, topo) + camadas v1: mapa, modelo AMR genérico, LaserScan, rastro, velocidade comandada × medida, TF | Robô andando na cena, ao vivo e no replay |
| **2** | `replay-engine` + `DemoSource` (dados sintéticos) + timeline completa | Arrastar o cursor e ver uma caixa-robô andar |
| **3** | Camadas v1 (mapa, TF, scan, path, rastro, cmd_vel) + componentes | Um "RViz" com replay sobre dados sintéticos |
| **4** | Dataset real: Gazebo + Nav2 + TB4, gravado em MCAP; `ReplaySource` lê MCAP | Replay de uma navegação real simulada |
| **5** | `LiveSource` via foxglove_bridge | Robô simulado ao vivo, mesma tela |
| **6** | C++: `moody_compression` (SwingingDoor, DeadReckoning) com testes | Porta de entrada no C++ |
| **7** | C++: `moody_recorder` gravando localmente (JSONL/SQLite) | Historian rodando no robô simulado |
| **8** | Servidor: TimescaleDB, endpoint do pacote de replay, store-and-forward | Historian de ponta a ponta |
| **9** | Camadas fase 2/3, multi-robô, caixa-preta MCAP | Paridade com o RViz e além |

As fases web (0 a 5) e C++ (6 e 7) podem andar **em paralelo**: o contrato entre elas é o formato do pacote de replay (`packages/protocol`).

## 9. Decisões complementares (2026-11-10)

1. **Skip:** os valores 1, 5, 10, 30 e x estão em **segundos**.
2. **Velocidade de reprodução:** sim. Há um seletor de velocidade no play (0.25×, 0.5×, 1×, 2×, 4×, 8×).
3. **TypeScript** em todo o código web.
4. **Tema:** só o **escuro** na v1. Os tokens já ficam prontos para um tema claro futuro.
