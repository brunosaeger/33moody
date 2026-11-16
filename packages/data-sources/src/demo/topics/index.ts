import { batteryTopic } from './battery';
import { cmdVelTopic } from './cmdVel';
import { imuTopic } from './imu';
import { mapTopic } from './map';
import { odomTopic } from './odom';
import { scanTopic } from './scan';
import type { DemoTopic } from './types';

/** Todos os tópicos publicados pelo robô demo. */
export const demoTopics: readonly DemoTopic[] = [
  batteryTopic,
  cmdVelTopic,
  imuTopic,
  mapTopic,
  odomTopic,
  scanTopic,
];

export type { DemoTopic } from './types';
