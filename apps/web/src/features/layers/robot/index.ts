import type { LayerDefinition } from '../types';
import { RobotLayer } from './RobotLayer';

export const robotLayer: LayerDefinition = {
  id: 'robot',
  title: 'Modelo do robô',
  description: 'O robô na pose atual (modelo genérico até termos o URDF).',
  topics: (p) => [p.topics.pose],
  defaultEnabled: true,
  Component: RobotLayer,
};
