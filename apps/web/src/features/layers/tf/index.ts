import type { LayerDefinition } from '../types';
import { TfLayer } from './TfLayer';

export const tfLayer: LayerDefinition = {
  id: 'tf',
  title: 'Frames (TF)',
  description: 'Eixos de cada frame da árvore de TF (x vermelho, y verde, z azul).',
  topics: () => ['/tf', '/tf_static'],
  defaultEnabled: false,
  Component: TfLayer,
};
