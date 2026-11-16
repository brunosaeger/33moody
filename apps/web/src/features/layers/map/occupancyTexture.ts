import { Color, DataTexture, NearestFilter, RGBAFormat, SRGBColorSpace, type RGB } from 'three';
import { colors } from '@moody/theme';
import type { OccupancyGrid } from '@/lib/ros';

/** Cores do mapa: livre = chão escuro, ocupado = parede clara, desconhecido = transparente. */
const FREE = new Color(colors.panelRaisedHi);
const OCCUPIED = new Color('#c9d1dc');

const to255 = (v: number) => Math.round(v * 255);

/**
 * Converte um OccupancyGrid em textura RGBA (1 pixel por célula).
 * A linha 0 do grid é y mínimo, igual à linha 0 da textura (v = 0, embaixo),
 * então não é preciso inverter.
 */
export function occupancyToTexture(grid: OccupancyGrid): DataTexture {
  const { width, height } = grid.info;
  const pixels = new Uint8Array(width * height * 4);
  const mixed = new Color();
  const srgb: RGB = { r: 0, g: 0, b: 0 };

  for (let k = 0; k < width * height; k++) {
    const v = grid.data[k] ?? -1;
    const o = k * 4;
    if (v < 0) {
      pixels[o + 3] = 0; // desconhecido: transparente (mostra a grade de chão)
      continue;
    }
    mixed.copy(FREE).lerp(OCCUPIED, Math.min(100, v) / 100);
    // O three guarda Color em espaço LINEAR; a textura é sRGB, então os
    // bytes precisam estar em sRGB (senão a cor sai escurecida duas vezes).
    mixed.getRGB(srgb, SRGBColorSpace);
    pixels[o] = to255(srgb.r);
    pixels[o + 1] = to255(srgb.g);
    pixels[o + 2] = to255(srgb.b);
    pixels[o + 3] = 255;
  }

  const texture = new DataTexture(pixels, width, height, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter; // células nítidas, como no RViz
  texture.needsUpdate = true;
  return texture;
}
