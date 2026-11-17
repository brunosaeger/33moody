/**
 * Escala FRIA → QUENTE para marcações (ex.: pontos de interesse da timeline).
 * Percorre o círculo de matizes do ciano ao laranja passando por azul,
 * violeta, magenta e vermelho. Saturação alta e luminosidade média: cores
 * sempre vivas e com contraste para texto branco.
 *
 * `t` = 0 é o mais frio e 1 o mais quente; cada `t` diferente dá um TOM
 * diferente (a matiz é contínua, nunca repete).
 */
const HUE_COLD = 185; // ciano
const HUE_WARM = 385; // 25° = laranja (dá a volta pelo vermelho)
const SATURATION = 88;
const LIGHTNESS = 50;

export function coldToWarm(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const hue = (HUE_COLD + (HUE_WARM - HUE_COLD) * clamped) % 360;
  return `hsl(${hue.toFixed(1)} ${SATURATION}% ${LIGHTNESS}%)`;
}
