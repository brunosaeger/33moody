import { colors, fonts, radii, sizes } from './tokens';

/**
 * Converte camelCase em kebab-case: `panelRaisedHi` -> `panel-raised-hi`.
 */
function toKebab(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * Monta o mapa `--nome-do-token -> valor` a partir dos tokens.
 * Prefixos por grupo: cores sem prefixo (`--panel-base`), fontes em
 * `--font-*`, raios em `--radius-*` e tamanhos em `--size-*`.
 */
export function buildCssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(colors)) vars[`--${toKebab(k)}`] = v;
  for (const [k, v] of Object.entries(fonts)) vars[`--font-${toKebab(k)}`] = v;
  for (const [k, v] of Object.entries(radii)) vars[`--radius-${toKebab(k)}`] = v;
  for (const [k, v] of Object.entries(sizes)) vars[`--size-${toKebab(k)}`] = v;
  return vars;
}

/**
 * Escreve os tokens como CSS custom properties no elemento raiz.
 * Chamar UMA vez, antes do primeiro render (ver apps/web/src/main.tsx).
 */
export function applyTheme(root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(buildCssVariables())) {
    root.style.setProperty(name, value);
  }
  root.style.colorScheme = 'dark';
}
