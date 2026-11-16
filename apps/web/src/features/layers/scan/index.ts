import type { LayerDefinition } from '../types';
import { ScanLayer } from './ScanLayer';

export const scanLayer: LayerDefinition = {
  id: 'scan',
  title: 'LiDAR (LaserScan)',
  description: 'Pontos que o LiDAR está enxergando, na altura do sensor.',
  topics: (p) => [p.topics.scan],
  defaultEnabled: true,
  Component: ScanLayer,
};
