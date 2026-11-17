# 33moody: contexto principal (orquestrador)

Plataforma web de **diagnóstico robótico** da 33Robotics: acompanhar o robô **ao vivo** em 3D e fazer o **replay** técnico-visual de um momento passado ("Moody Blues"), reconstruído a partir de dados gravados (historian), sem vídeo.

Este arquivo é só o **mapa** (é o único carregado sozinho em toda sessão). O detalhe de cada parte fica num arquivo `CONTEXTO-<nome-do-módulo>.md` dentro da pasta do próprio módulo.

**Antes de mexer num módulo, leia o `CONTEXTO-*.md` dele** (tabela abaixo). Não leia os dos outros sem necessidade: assim cada sessão gasta tokens só com o que está tocando.

## Regras do projeto (valem sempre)

- **Idioma:** português brasileiro em código comentado, docs e conversa. Explicar o conceito antes de implementar; C++ explicado em detalhe.
- **Modularização:** antes de escrever um trecho, perguntar: *"isso faz sentido aqui ou pertence a outro módulo?"*. Plataforma profissional, usada por outras pessoas.
- **Tela única** (estilo Photoshop): só existe o login antes. Nada de rotas ou páginas. **Só desktop.**
- **Layout fixo:** viewport 3D + **um** menu lateral **à direita**, com abas (Camadas, Componentes), largura ajustável pelo divisor. Docking e janelas flutuantes foram testados e **abandonados**: não reintroduzir.
- **Visual:** assinatura do LIFTYMapper; cores e fontes só via `@moody/theme`.
- **Nada específico do robô no código:** tópicos, frames e dimensões vêm do perfil do robô. O robô alvo ainda **não está definido**; a simulação usa TurtleBot3 + Nav2 (ROS 2 Jazzy, Gazebo).
- **UI nunca fala com o robô direto:** tudo passa por um `DataSource`.
- **Git:** autor `brunosaeger`; commit e push só quando o Bruno pedir; uma branch por fase (`feat/...`).

## Mapa dos módulos

| Módulo | O que é | Contexto |
|---|---|---|
| `packages/data-sources` | Contrato `DataSource` + fontes (demo; depois foxglove, MCAP, historian). TS puro | [CONTEXTO-fontes-de-dados.md](packages/data-sources/CONTEXTO-fontes-de-dados.md) |
| `packages/theme` | Tokens de cor, fonte e tamanho (CSS + Three.js) | [CONTEXTO-tema-visual.md](packages/theme/CONTEXTO-tema-visual.md) |
| `apps/web` | O viewer (React 19 + Vite + r3f): estrutura, convenções, como rodar e testar | [CONTEXTO-viewer-web.md](apps/web/CONTEXTO-viewer-web.md) |
| `apps/web/src/data` | Sessão, relógio (live/replay) e hooks de leitura de tópicos | [CONTEXTO-sessao-e-relogio.md](apps/web/src/data/CONTEXTO-sessao-e-relogio.md) |
| `apps/web/src/features/viewport` | Cena 3D, câmera e sobreposições | [CONTEXTO-viewport-3d.md](apps/web/src/features/viewport/CONTEXTO-viewport-3d.md) |
| `apps/web/src/features/layers` | Aba Camadas: mapa, robô, scan, rastro, velocidade, TF | [CONTEXTO-camadas.md](apps/web/src/features/layers/CONTEXTO-camadas.md) |
| `apps/web/src/features/timeline` | Linha do tempo: ao vivo, faixa de replay, cursor, controles | [CONTEXTO-linha-do-tempo.md](apps/web/src/features/timeline/CONTEXTO-linha-do-tempo.md) |
| `apps/web/src/features/robot-components` | Aba Componentes: quadro de widgets por tópico | [CONTEXTO-componentes.md](apps/web/src/features/robot-components/CONTEXTO-componentes.md) |
| **Armazenamento de dados** | **Caderno central: densidade de dados, rosbag/MCAP, compressão, historian** | [docs/CONTEXTO-armazenamento-de-dados.md](docs/CONTEXTO-armazenamento-de-dados.md) |
| Especificação | UX, arquitetura e roadmap completos | [docs/01-especificacao-interface.md](docs/01-especificacao-interface.md) |

Ainda não existem (criar o `CONTEXTO-*.md` junto com o módulo): `packages/replay-engine`, `packages/protocol`, `apps/server`, `robot/` (workspace colcon C++: `moody_compression`, `moody_recorder`), `config/robots/`.

## Como manter estes arquivos

1. **Mexeu num módulo → atualize o `CONTEXTO-*.md` dele** no mesmo trabalho. Módulo novo ou pasta que ganhou peso próprio → crie `CONTEXTO-<nome-sugestivo>.md` nela (nome que diga o que o módulo faz, em português, ex.: `CONTEXTO-gravador-historian.md`) e adicione uma linha na tabela acima.
2. **Conteúdo de um `CONTEXTO-*.md`:** propósito, arquivos-chave, contratos, decisões (com o porquê), armadilhas já encontradas, pendências. Curto e factual; nada que o código já diga sozinho.
3. **Toda descoberta sobre volume, taxa, compressão ou fidelidade de dados vai para [docs/CONTEXTO-armazenamento-de-dados.md](docs/CONTEXTO-armazenamento-de-dados.md)**, com data e se é estimativa ou medição. É o tema central do projeto.
4. **Este arquivo fica curto:** só regras globais, o mapa e o estado atual.

## Estado atual (2026-11-17)

- ✅ Fase 0: monorepo, tema, shell (header, menu lateral, componentes, timeline com replay sobre o demo).
- ✅ Fase 1: viewport 3D (commit `876dfe2`, já no `main` e no GitHub).
- Branch de trabalho atual: `feat/live-foxglove`.
- ✅ **Passo 1 (2026-11-17):** robô real ao vivo. `FoxgloveSource`, árvore de TF no frontend (pose por `map → odom → base_footprint`), formulário de conexão, perfil TurtleBot3 Waffle. Testado com a simulação do Nav2.
- ▶️ **Próximo, passo 2:** gravar a simulação em MCAP e criar a `ReplaySource` (replay de dados reais na timeline).
- Depois: passo 3 = gravador C++ comprimido + prova "mesmo replay, erro máximo conhecido, X % do tamanho".

## Ambiente da máquina do Bruno

- Ubuntu 24.04; ROS 2 **Jazzy** em `/opt/ros/jazzy` (também há noetic e rolling; usar jazzy).
- Instalados: `turtlebot3_gazebo`, `nav2_bringup`, `rosbag2_storage_mcap`, Gazebo (`gz`), `foxglove_bridge` 3.6.3 (`ros2 launch foxglove_bridge foxglove_bridge_launch.xml`, porta 8765).
- O apt costuma travar com o unattended-upgrade: usar `apt-get -o DPkg::Lock::Timeout=580 ...` para esperar a trava (ou snap `--classic`).
- Dev server: `cd apps/web && npx vite --host 127.0.0.1 --port 5173 --strictPort` (o `npm run dev -- --flags` perde os flags).

### Subir o robô simulado (sempre `source /opt/ros/jazzy/setup.bash` antes)

1. Simulação + Nav2, sem janela: `ros2 launch nav2_bringup tb3_simulation_launch.py headless:=True use_rviz:=False` (sobe o **Waffle** no `turtlebot3_world`, nascendo em (-2, -0.5)).
2. Pose inicial do AMCL (sem ela não existe o frame `map`): `ros2 topic pub -t 3 -r 2 /initialpose geometry_msgs/msg/PoseWithCovarianceStamped "{header: {frame_id: map}, pose: {pose: {position: {x: -2.0, y: -0.5}, orientation: {w: 1.0}}}}"`
3. Ponte: `ros2 launch foxglove_bridge foxglove_bridge_launch.xml port:=8765`
4. Mandar andar: `ros2 topic pub -t 2 -r 1 /goal_pose geometry_msgs/msg/PoseStamped "{header: {frame_id: map}, pose: {position: {x: 1.6, y: 0.5}, orientation: {w: 1.0}}}"`
5. No 33moody: Conectar em `ws://localhost:8765` com o perfil TurtleBot3 Waffle.
- A CLI do ROS falha (`context is invalid`) se vários `ros2 topic bw/hz` rodam em paralelo: rodar um de cada vez.
