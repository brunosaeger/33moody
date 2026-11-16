import type { DemoTopic } from './types';

/** geometry_msgs/msg/Twist: velocidade COMANDADA pelo controlador (sem ruído). */
export const cmdVelTopic: DemoTopic = {
  name: '/cmd_vel',
  schemaName: 'geometry_msgs/msg/Twist',
  rateHz: 20,
  build: (s) => ({
    linear: { x: s.linear, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: s.angular },
  }),
};
