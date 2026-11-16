import { makeHeader } from '../../ros/time';
import type { DemoTopic } from './types';

// Constantes de sensor_msgs/msg/BatteryState
const POWER_SUPPLY_STATUS_DISCHARGING = 2;
const POWER_SUPPLY_HEALTH_GOOD = 1;
const POWER_SUPPLY_TECHNOLOGY_LION = 2;

export const batteryTopic: DemoTopic = {
  name: '/battery_state',
  schemaName: 'sensor_msgs/msg/BatteryState',
  rateHz: 1,
  build: (s, timeMs, noise) => ({
    header: makeHeader(timeMs, 'base_link'),
    voltage: 44 + 6 * s.battery + noise(0.05),
    temperature: 31 + noise(0.2),
    current: -(2 + 3 * Math.abs(s.linear)) + noise(0.1),
    charge: 40 * s.battery,
    capacity: 40,
    design_capacity: 40,
    percentage: s.battery,
    power_supply_status: POWER_SUPPLY_STATUS_DISCHARGING,
    power_supply_health: POWER_SUPPLY_HEALTH_GOOD,
    power_supply_technology: POWER_SUPPLY_TECHNOLOGY_LION,
    present: true,
    location: 'main',
    serial_number: 'DEMO-0001',
  }),
};
