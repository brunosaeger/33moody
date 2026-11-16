import { mapLayer } from './map';
import { robotLayer } from './robot';
import { scanLayer } from './scan';
import { tfLayer } from './tf';
import { trailLayer } from './trail';
import { velocityLayer } from './velocity';
import type { LayerDefinition } from './types';

/**
 * Todas as camadas disponíveis, na ordem em que aparecem na aba Camadas.
 * Camada nova = uma pasta com a definição + uma linha aqui.
 */
export const LAYERS: readonly LayerDefinition[] = [
  mapLayer,
  robotLayer,
  scanLayer,
  trailLayer,
  velocityLayer,
  tfLayer,
];
