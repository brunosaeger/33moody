import { poseTopics } from '@/config/robotProfiles';
import type { LayerDefinition } from '../types';
import { TrailLayer } from './TrailLayer';

export const trailLayer: LayerDefinition = {
  id: 'trail',
  title: 'Rastro',
  description: 'Caminho percorrido. No replay, do início da faixa até o cursor.',
  topics: poseTopics,
  defaultEnabled: true,
  Component: TrailLayer,
};
