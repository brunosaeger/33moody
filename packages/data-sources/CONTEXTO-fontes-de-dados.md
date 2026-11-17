# packages/data-sources (`@moody/data-sources`)

TypeScript puro, **sem React**. Define o contrato `DataSource` e as fontes de dados. A UI só conhece o contrato: trocar de fonte não mexe na tela.

## Contrato (`src/types.ts`)

- `start()`, `stop()`, `topics()` (deve devolver a **mesma referência** de array enquanto a lista não mudar), `onTopicsChange()`, `subscribe(topic, listener)`.
- `messageAt?(topic, timeMs)`: **opcional**, só para fontes com histórico. Semântica atual: a **última mensagem publicada até `timeMs`** (degrau), ou `undefined` (inclusive para o futuro). Use `supportsReplay(source)` para checar.
- `MessageEvent.timeMs`: ms desde a época Unix, vindo do `header.stamp` (senão, do instante de recebimento). `message` é o objeto JS com os **mesmos nomes de campo da msg ROS 2**.

## Arquivos

- `core/ListenerRegistry.ts`: lista de listeners por chave, reaproveitada pelas fontes.
- `ros/time.ts`, `ros/geometry.ts`: header/stamp ROS 2 e yaw ↔ quaternion.
- `demo/`: o robô demo.
  - O estado é uma **função pura do tempo** (`demoStateAt`): elipse ao redor de um pilar numa sala de 10×6 m (`world.ts` com raycast para o scan).
  - Ruído: ao vivo aleatório (escala 0.5); no replay, com seed (mulberry32, escala 4) + `agitation.ts`, para os dados "mexerem" ao arrastar o cursor na demonstração. Mesmo instante = mesmos valores.
  - `topics/`: um arquivo por tópico (`build(state, timeMs, noise)`, `rateHz`, `latched?`). `/map` é latched e gerado uma vez.
  - `DemoSource.ts`: `messageAt` quantiza pelo período do tópico; tópico latched é entregue no `subscribe` via `queueMicrotask`.

## Próximo (passo 1)

- `src/foxglove/FoxgloveSource.ts`: WebSocket com o `foxglove_bridge` (`@foxglove/ws-protocol`), lista de tópicos pelos canais anunciados, decodificação CDR pelo esquema (`@foxglove/rosmsg2-serialization`). Ao vivo apenas: **não** implementa `messageAt`.
- Depois: `ReplaySource` (MCAP) e a fonte do historian. Ver [docs/CONTEXTO-armazenamento-de-dados.md](../../docs/CONTEXTO-armazenamento-de-dados.md).

## Regras

- Nada de React nem de tema aqui.
- Fonte nova = pasta nova (`src/<fonte>/`) exportada em `src/index.ts`.
