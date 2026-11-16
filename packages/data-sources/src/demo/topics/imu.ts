import { yawToQuaternion } from '../../ros/geometry';
import { makeHeader } from '../../ros/time';
import type { DemoTopic } from './types';

const GRAVITY = 9.81;

/** sensor_msgs/msg/Imu */
export const imuTopic: DemoTopic = {
  name: '/imu',
  schemaName: 'sensor_msgs/msg/Imu',
  rateHz: 50,
  build: (s, timeMs, noise) => ({
    header: makeHeader(timeMs, 'imu_link'),
    orientation: yawToQuaternion(s.yaw + noise(0.002)),
    angular_velocity: { x: noise(0.002), y: noise(0.002), z: s.angular + noise(0.003) },
    linear_acceleration: {
      x: s.accel + noise(0.02),
      // aceleração centrípeta = v · ω
      y: s.linear * s.angular + noise(0.02),
      z: GRAVITY + noise(0.03),
    },
  }),
};
