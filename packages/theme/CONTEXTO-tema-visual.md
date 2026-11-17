# packages/theme (`@moody/theme`)

Fonte única de cores, fontes, raios e tamanhos, inspirada na assinatura visual do LIFTYMapper. Só tema escuro na v1 (os tokens já permitem um claro).

- `src/tokens.ts`: `colors` (painéis `panelBase`/`panelRaised`/`panelRaisedHi`/`panelLine`, texto, acentos `accentAmber` e `accentCyan`, estados `stateError`/`stateSuccess`/`stateWarn`, `brand`), `fonts`, `radii`, `sizes`.
- `src/markers.ts`: `coldToWarm(t)` → cor viva de uma escala fria (ciano) → quente (laranja), um tom por `t`. Usada pelos pontos de interesse da timeline; `textOnVivid` (branco) é o texto sobre ela.
- `src/applyTheme.ts`: escreve os tokens como variáveis CSS (`--panel-base`, `--font-mono`…), chamado em `apps/web/src/main.tsx`.

## Regras

- CSS usa `var(--...)`; Three.js importa `colors` direto. **Nada de hex solto** no app (exceções: tons do modelo 3D e do mapa, comentadas no próprio arquivo).
- Cor nova entra aqui primeiro.
- Atenção no Three.js: `Color` guarda em espaço **linear**. Bytes de textura sRGB exigem `getRGB(..., SRGBColorSpace)` (ver `features/layers`).
