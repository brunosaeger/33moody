import { coldToWarm } from '@moody/theme';

/**
 * Teclas dos pontos de interesse, na ordem do teclado QWERTY (Q → M).
 * A ordem define a cor: Q é a mais fria, M a mais quente.
 */
export const MARKER_KEYS = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('');

/** `KeyboardEvent.code` (tecla física, ex.: "KeyQ") → letra, se for uma tecla de marcação. */
export function markerKeyFromCode(code: string): string | undefined {
  const letter = code.startsWith('Key') ? code.slice(3) : '';
  return MARKER_KEYS.includes(letter) ? letter : undefined;
}

/** Cor viva e única da letra (tom diferente para cada uma). */
export function markerColor(letter: string): string {
  return coldToWarm(MARKER_KEYS.indexOf(letter) / (MARKER_KEYS.length - 1));
}
