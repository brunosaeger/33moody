/**
 * Encurta o nome do tipo para exibição: `sensor_msgs/msg/BatteryState` -> `sensor_msgs/BatteryState`.
 * O `/msg/` é ruído para quem lê; o nome completo continua disponível no tooltip.
 */
export function shortSchemaName(schemaName: string): string {
  return schemaName.replace('/msg/', '/');
}
