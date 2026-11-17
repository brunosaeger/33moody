# features/timeline: linha do tempo

Só aparece com robô conectado (`Timeline.tsx`; o `TimelineContent` monta o `useClockDriver`). Ao vivo fica colada no presente; digitar uma faixa inicia o replay.

## Arquivos

- `TimelineBar.tsx`: régua, preenchimento da faixa, **dois marcadores vermelhos** (início e fim), **cursor em seta** arrastável com rótulo (que vira de lado perto da borda), marcador AGORA ao vivo. Arraste por pointer capture.
- `ruler.ts`: janelas de exibição live/replay e `computeTicks` alinhado ao fuso local.
- `PlaybackControls.tsx`: skips de 1, 5, 10, 30 e x segundos (x personalizado, padrão 60 s), play/pause e velocidade.
- `RangePicker.tsx`: calendário (`showPicker`), horas com segundos (`step=1`), sugestão dos últimos 10 min, botão "Ver replay".
- `rangeInput.ts`: `validateRange(data, início, fim, bounds)` (máximo de 24 h; corta a faixa nos limites onde há dado). `DataBounds`: gravação = início e fim do arquivo; ao vivo = até "agora".
- `useDataBounds.ts`: os limites da fonte atual.
- **Gravação** (`isRecording`): a sessão abre direto em replay no arquivo inteiro; o `RangePicker` sugere o arquivo inteiro; no lugar de "Voltar ao vivo" aparece o selo GRAVAÇÃO.
- `TimelineStatus.tsx`: relógio (`ClockReadout`) e botão de voltar ao vivo.
- Formatação de datas e horas: `shared/lib/timeFormat.ts`.
- Fonte sem histórico (`supportsReplay` falso, ex.: Foxglove ao vivo): sem controles de play nem seletor de faixa, só a régua ao vivo e um aviso.

## Pendências

- Ao vivo com historian: mostrar na régua onde existe dado gravado.
- Marcadores de evento (erros, paradas) na régua.
- Faixa que atravessa a meia-noite.
- Futuro: indicar o erro máximo do replay comprimido no trecho (ver [docs/CONTEXTO-armazenamento-de-dados.md](../../../../../docs/CONTEXTO-armazenamento-de-dados.md)).
