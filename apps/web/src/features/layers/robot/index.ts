import { poseTopics } from '@/config/robotProfiles';
import type { LayerDefinition } from '../types';
import { RobotLayer } from './RobotLayer';

export const robotLayer: LayerDefinition = {
  id: 'robot',
  title: 'Modelo do robô',
  description: 'O robô na pose atual (modelo genérico até termos o URDF).',
  topics: poseTopics,
  defaultEnabled: true,
  Component: RobotLayer,
};
