import type { LayerDefinition } from '../types';
import { VelocityLayer } from './VelocityLayer';

export const velocityLayer: LayerDefinition = {
  id: 'velocity',
  title: 'Velocidade',
  description: 'Seta âmbar = comandada (cmd_vel); seta ciano = medida (odometria).',
  topics: (p) => [p.topics.cmdVel, p.topics.pose],
  defaultEnabled: true,
  Component: VelocityLayer,
};
