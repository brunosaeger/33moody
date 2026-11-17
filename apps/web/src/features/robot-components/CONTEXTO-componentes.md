# features/robot-components: aba Componentes

O "+" (`AddComponentButton`) lista os tópicos da fonte e cria um widget que mostra os campos da mensagem daquele tópico.

## Arquivos

- `board.ts`: **funções puras** do quadro (grade de 12 colunas, linha de 22 px): `parseBoard`, `EMPTY_BOARD`, `addWidget`, `removeWidget`, `applyLayout`.
- `boardStore.ts`: estado salvo em `moody.component-board.v1`, com merge validado por `parseBoard`.
- `ComponentBoard.tsx`: react-grid-layout v2 (`useContainerWidth`, `gridConfig`, `dragConfig`, `resizeConfig`). Só os widgets se movem e redimensionam, nunca a aba.
- `ComponentWidget.tsx`: cabeçalho com o nome do tópico, Hz ao vivo ou selo REPLAY. Lê com `useTopicMessage`.
- `MessageFields.tsx`: a mensagem achatada (`lib/ros/flattenMessage`) em linhas campo/valor.

## Notas

- Arrays grandes (ex.: `ranges` do scan) precisam continuar resumidos para não travar a UI quando chegarem dados reais.
- Futuro: widgets especializados por tipo de mensagem (gráfico uPlot, bateria), via registry, como as camadas.
