import { yawToQuaternion } from '../../ros/geometry';
import { makeHeader } from '../../ros/time';
import type { DemoTopic } from './types';

/** nav_msgs/msg/Odometry: pose e velocidade MEDIDAS (com ruído). */
export const odomTopic: DemoTopic = {
  name: '/odom',
  schemaName: 'nav_msgs/msg/Odometry',
  rateHz: 20,
  build: (s, timeMs, noise) => ({
    header: makeHeader(timeMs, 'odom'),
    child_frame_id: 'base_link',
    pose: {
      pose: {
        position: { x: s.x, y: s.y, z: 0 },
        orientation: yawToQuaternion(s.yaw),
      },
    },
    twist: {
      twist: {
        linear: { x: s.linear + noise(0.01), y: 0, z: 0 },
        angular: { x: 0, y: 0, z: s.angular + noise(0.005) },
      },
    },
  }),
};
