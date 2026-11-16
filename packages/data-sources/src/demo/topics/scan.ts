import { makeHeader } from '../../ros/time';
import { raycast } from '../world';
import type { DemoTopic } from './types';

const SAMPLES = 360;
const RANGE_MIN = 0.05;
const RANGE_MAX = 12;
const ANGLE_INCREMENT = (2 * Math.PI) / SAMPLES;

/** sensor_msgs/msg/LaserScan: LiDAR 2D de 360°, gerado por raycast na sala demo. */
export const scanTopic: DemoTopic = {
  name: '/scan',
  schemaName: 'sensor_msgs/msg/LaserScan',
  rateHz: 10,
  build: (s, timeMs, noise) => {
    const ranges = Array.from({ length: SAMPLES }, (_, i) => {
      const angle = s.yaw - Math.PI + i * ANGLE_INCREMENT; // ângulo no mundo
      const r = raycast(s.x, s.y, angle) + noise(0.01);
      return Math.min(RANGE_MAX, Math.max(RANGE_MIN, r));
    });
    return {
      header: makeHeader(timeMs, 'laser'),
      angle_min: -Math.PI,
      angle_max: Math.PI - ANGLE_INCREMENT,
      angle_increment: ANGLE_INCREMENT,
      time_increment: 0,
      scan_time: 0.1,
      range_min: RANGE_MIN,
      range_max: RANGE_MAX,
      ranges,
      intensities: [],
    };
  },
};
