import type { LayerDefinition } from '../types';
import { TfLayer } from './TfLayer';

export const tfLayer: LayerDefinition = {
  id: 'tf',
  title: 'Frames (TF)',
  description: 'Eixos dos frames map, base_link e laser (x vermelho, y verde, z azul).',
  topics: (p) => [p.topics.pose],
  defaultEnabled: false,
  Component: TfLayer,
};
