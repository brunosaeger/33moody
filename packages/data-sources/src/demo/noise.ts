/**
 * Geradores de ruído para os valores sintéticos do robô demo.
 *
 * `Noise` recebe o desvio desejado e devolve uma amostra ≈ gaussiana
 * (soma de 3 uniformes, média 0, desvio ≈ sigma).
 */
export type Noise = (sigma: number) => number;

function gaussianFrom(uniform: () => number): Noise {
  return (sigma) => ((uniform() + uniform() + uniform() - 1.5) / 0.5) * sigma;
}

/** Ruído aleatório de verdade: cada chamada é diferente (modo ao vivo). */
export const randomNoise: Noise = gaussianFrom(Math.random);

/**
 * Ruído DETERMINÍSTICO: a mesma semente gera sempre a mesma sequência.
 * No replay, voltar ao mesmo instante precisa mostrar os mesmos valores.
 * (PRNG mulberry32: pequeno, rápido e bom o bastante para demo.)
 */
export function seededNoise(seed: number): Noise {
  let a = seed >>> 0;
  const uniform = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return gaussianFrom(uniform);
}

/** Multiplica a intensidade de um gerador de ruído. */
export function scaledNoise(noise: Noise, factor: number): Noise {
  return (sigma) => noise(sigma * factor);
}

/** Hash simples de string -> inteiro de 32 bits (para semear por tópico). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
