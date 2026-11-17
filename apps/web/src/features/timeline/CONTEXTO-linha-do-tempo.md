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
- `TimelineStatus.tsx`: relógio (`ClockReadout`; **no replay com milissegundos**, `formatClockMs`) e botão de voltar ao vivo / selo GRAVAÇÃO.
- `MessageStepper.tsx`: `⏮ [tópico] ⏭` ao lado do relógio, só no replay e se a fonte tem `neighborMessageTime`. O tópico abre um menu **com busca**. Pausa e leva o cursor ao instante EXATO da mensagem anterior/seguinte (padrão: o scan do perfil).
- `stepperStore.ts`: o tópico do passo (compartilhado entre os botões e as teclas `,` `.`).
- `transport.ts`: ações sem React usadas pelos botões E pelo teclado: `stepMessage`, `shiftSpeed` (só valores de `PLAYBACK_SPEEDS`), `startScrub` (avanço contínuo em escada, `SCRUB_STAGES`: 2×, a partir de 1,5 s 4×, a partir de 4 s 8×; pelo tempo real decorrido, inclusive o trecho até soltar; pausa e restaura o play ao soltar).
- `useTransportHotkeys.ts` (montado no `TimelineContent`, só age no replay): **Espaço** play/pause · **→/←** toque ±1 s, segurar = avanço contínuo (toque < 250 ms) · **↑/↓** velocidade · **. / ,** mensagem seguinte/anterior. Ignora se estiver digitando (input/select/textarea), com Ctrl/Alt/Meta, ou se outro elemento já usou a tecla (`defaultPrevented`; o divisor do `SplitPane` faz isso com as setas). A repetição automática do teclado é ignorada. Os botões mostram o atalho no tooltip; o seletor de velocidade solta o foco depois de escolher.
- Campos de hora do `RangePicker` com `step=0.001` (aceitam milissegundos); `parseLocalDateTime` lê `HH:MM:SS.mmm`.
- **Armadilha de precisão:** o relógio mostra ms truncados; uma mensagem gravada em 42.621850 ainda não vale num cursor digitado em 42.621. Para cair exatamente numa mensagem, usar o passo de mensagem (validado contra o `rosbag2_py` em 2026-11-17).
- Formatação de datas e horas: `shared/lib/timeFormat.ts`.
- Fonte sem histórico (`supportsReplay` falso, ex.: Foxglove ao vivo): sem controles de play nem seletor de faixa, só a régua ao vivo e um aviso.

## Pontos de interesse (`markers/`)

Letras **Q … M** (teclas físicas, `KeyboardEvent.code`; ordem QWERTY) marcam o instante atual: o cursor no replay, o agora ao vivo.
- 1º toque marca; os seguintes levam até o ponto **pausado**. Shift+letra redefine. Na barra: clique na bolinha = ir; clique direito = apagar.
- Ir ao ponto: dentro da faixa só move o cursor; numa gravação fora da faixa, volta ao arquivo inteiro; ao vivo com histórico (demo), abre o replay de 1 min antes do ponto até agora. Ao vivo sem histórico (Foxglove), não faz nada.
- Cor: `coldToWarm` (`@moody/theme`) pela posição da letra em `MARKER_KEYS`: Q = ciano (frio) … M = laranja (quente), passando por azul, violeta, magenta e vermelho. Matiz contínua (um tom por letra), saturação 88 %, luminosidade 50 %; letra em `--text-on-vivid` (branco).
- Arquivos: `keys.ts` (ordem e cor), `markersStore.ts` (por fonte, `DataSource.id`, salvo em `moody.markers.v1`), `actions.ts` (marcar / ir), `useMarkerHotkeys.ts`, `MarkerFlags.tsx` (faixa + bolinha, desenhada abaixo do cursor).
- Atalhos de letra ignoram o evento se o teclado está ocupado (`shared/lib/keyboard.ts`: campo, lista, Ctrl/Alt/Meta).

## Pendências

- Ao vivo com historian: mostrar na régua onde existe dado gravado.
- Marcadores de evento (erros, paradas) na régua.
- Faixa que atravessa a meia-noite.
- Futuro: indicar o erro máximo do replay comprimido no trecho (ver [docs/CONTEXTO-armazenamento-de-dados.md](../../../../../docs/CONTEXTO-armazenamento-de-dados.md)).
