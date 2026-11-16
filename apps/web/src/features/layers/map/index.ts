import type { LayerDefinition } from '../types';
import { MapLayer } from './MapLayer';

export const mapLayer: LayerDefinition = {
  id: 'map',
  title: 'Mapa',
  description: 'Mapa de ocupação: paredes e obstáculos fixos.',
  topics: (p) => [p.topics.map],
  defaultEnabled: true,
  Component: MapLayer,
};
