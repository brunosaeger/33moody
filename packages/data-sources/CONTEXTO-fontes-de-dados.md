# packages/data-sources (`@moody/data-sources`)

TypeScript puro, **sem React**. Define o contrato `DataSource` e as fontes de dados. A UI só conhece o contrato: trocar de fonte não mexe na tela.

## Contrato (`src/types.ts`)

- `start()`, `stop()`, `topics()` (deve devolver a **mesma referência** de array enquanto a lista não mudar), `onTopicsChange()`, `subscribe(topic, listener)`.
- `messageAt?(topic, timeMs)`: **opcional**, só para fontes com histórico. Semântica atual: a **última mensagem publicada até `timeMs`** (degrau), ou `undefined` (inclusive para o futuro). Use `supportsReplay(source)` para checar.
- `onStatusChange?(listener)`: **opcional**; fontes que podem cair avisam `{ state: 'closed', reason }`. Não é emitido quando a própria UI chama `stop()`.
- `messagesInRange?(topic, startMs, endMs)`: **opcional**; todas as mensagens do intervalo, em ordem. O TF do replay precisa disso (cada /tf traz só parte da árvore).
- `recordedRange?()`: **opcional**; fontes GRAVADAS (arquivo) informam o intervalo existente. `isRecording(source)` = tem `recordedRange` e `messageAt`; a sessão abre essas fontes direto em replay.
- `MessageEvent.timeMs`: ms desde a época Unix **no relógio da timeline**. Fontes ao vivo usam o instante de chegada ao navegador (o `header.stamp` pode ser tempo de simulação, que começa em 0); fontes gravadas usam o instante gravado. `message` é o objeto JS com os **mesmos nomes de campo da msg ROS 2** (int64 vira `bigint`).

## Arquivos

- `core/ListenerRegistry.ts`: lista de listeners por chave, reaproveitada pelas fontes.
- `ros/time.ts`, `ros/geometry.ts`: header/stamp ROS 2 e yaw ↔ quaternion.
- `demo/`: o robô demo.
  - O estado é uma **função pura do tempo** (`demoStateAt`): elipse ao redor de um pilar numa sala de 10×6 m (`world.ts` com raycast para o scan).
  - Ruído: ao vivo aleatório (escala 0.5); no replay, com seed (mulberry32, escala 4) + `agitation.ts`, para os dados "mexerem" ao arrastar o cursor na demonstração. Mesmo instante = mesmos valores.
  - `topics/`: um arquivo por tópico (`build(state, timeMs, noise)`, `rateHz`, `latched?`). `/map` é latched e gerado uma vez.
  - `DemoSource.ts`: `messageAt` quantiza pelo período do tópico; tópico latched é entregue no `subscribe` via `queueMicrotask`.

## `foxglove/`: robô ao vivo (passo 1, ✅ 2026-11-17)

- `FoxgloveSource.ts`: WebSocket com o `foxglove_bridge`, usando o `FoxgloveClient` de `@foxglove/ws-protocol`.
  - **Subprotocolo:** o bridge 3.x (Foxglove SDK) **só aceita `foxglove.sdk.v1`**; os antigos aceitam `foxglove.websocket.v1`. Oferecemos os dois. Sem isso, o log do bridge mostra `handshake failed`.
  - `start()` resolve no `serverInfo`; falha com mensagem legível (porta errada, timeout de 5 s, URL inválida).
  - Os canais anunciados viram a lista de tópicos. Assinar um tópico ainda não anunciado fica **pendente** e assina quando o canal aparecer.
  - **Uma assinatura no bridge por tópico**, compartilhada por todos os listeners; solta quando o último sai.
  - Guarda a **última mensagem** por tópico e entrega na hora a quem assina depois (comportamento "latched", essencial para `/map` e `/tf_static`).
  - Decodificador criado só na primeira mensagem: tópico não assinado não custa CPU.
- Não implementa `messageAt` (ao vivo não guarda histórico).

## `ros/cdrDecoder.ts`: decodificação compartilhada

Esquema `ros2msg` + mensagem `cdr` → `MessageReader` (`@foxglove/rosmsg` + `@foxglove/rosmsg2-serialization`). Recebe `{ topic, messageEncoding, schemaEncoding, schema }`, então serve ao bridge e ao MCAP. Decodifica qualquer tipo, inclusive mensagens customizadas, sem tabela no código. `ros2idl` ainda não é suportado (avisa no console).

## `mcap/`: gravação em arquivo (passo 2, ✅ 2026-11-17)

- `McapSource.ts`: recebe um `Blob`/`File` (`.mcap` do `ros2 bag record -s mcap`). No `start()`, lê o arquivo inteiro para a memória, abre com `McapIndexedReader` (`@mcap/core`) e percorre as mensagens em ordem, separando os **bytes** por tópico. Chunks zstd são descomprimidos com `fzstd` (JS puro; os descompressores WASM da Foxglove são CommonJS e dependem do `Buffer` do Node, o que não serve no navegador). Limite de 1,5 GB.
  - Eixo do tempo = `logTime` (relógio de parede do gravador).
  - Implementa `messageAt`, `messagesInRange`, `recordedRange` e `stats()` (mensagens e bytes por tópico). `subscribe` aceita listeners, mas nunca emite (não existe "ao vivo").
- `TopicTrack.ts`: as mensagens de um tópico (tempos + bytes), busca binária e **decodificação sob demanda com cache** (2048 por tópico).
- **Limite conhecido:** carrega o arquivo inteiro na thread da UI (~9 s para 124 MB descomprimidos no Chrome de teste). Para arquivos grandes: leitura sob demanda pelo índice e Web Worker.

## Próximo

- A fonte do historian (gravação comprimida). Ver [docs/CONTEXTO-armazenamento-de-dados.md](../../docs/CONTEXTO-armazenamento-de-dados.md).

## Regras

- Nada de React nem de tema aqui.
- Fonte nova = pasta nova (`src/<fonte>/`) exportada em `src/index.ts`.
