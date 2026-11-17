# apps/web/src/data: sessão, relógio e leitura de tópicos

Ponte entre a UI e o `DataSource`. Nenhuma feature fala com a fonte por fora daqui.

## Arquivos

- `sessionStore.ts`: a fonte ativa (`connect`/`disconnect`). Ambos chamam `useClock.getState().goLive()`.
- `clockStore.ts` (`useClock`): `mode` (`live` | `replay`), `range`, `cursorMs`, `playing`, `speed` (`PLAYBACK_SPEEDS` 0.25× a 8×). Ações: `startReplay`, `goLive`, `seek` (limitado à faixa), `skip`, `setPlaying`, `togglePlay` (no fim, recomeça do início), `setSpeed`.
- `useClockDriver.ts`: laço `requestAnimationFrame` que anda o cursor durante o play. Montado só pela timeline.
- `topicStream.ts` → `followTopic(source, topic, mode, onMessage)`: **o núcleo de live/replay**.
  - Ao vivo: `subscribe` na fonte.
  - Replay: a cada mudança do cursor ou da faixa, chama `messageAt(topic, cursorMs)`, sem repetir a mesma mensagem.
- `useTopicMessage.ts`: estado React (`latest`, `hz`, `mode`), atualizado a cada 100 ms ao vivo e 50 ms no replay. Para a UI 2D.
- `useTopicRef.ts`: ref mutável, sem re-render. Para o `useFrame` do 3D a 60 fps.
- `useTopics.ts`, `RateMeter.ts`: lista de tópicos e medição de Hz.

## Decisões

- Dois hooks porque React re-renderizando a 60 fps trava a UI; o 3D lê por ref.
- Uma fonte sem `messageAt` (ex.: Foxglove ao vivo) simplesmente não mostra nada no replay. A timeline deve esconder ou bloquear o replay nesse caso (**a fazer no passo 1**).
- Quando o historian comprimido chegar, a interpolação fica no `replay-engine`, não aqui (ver [docs/CONTEXTO-armazenamento-de-dados.md](../../../../docs/CONTEXTO-armazenamento-de-dados.md)).
