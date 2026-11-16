import { makeHeader } from '../../ros/time';
import { PILLAR, ROOM } from '../world';
import type { DemoTopic } from './types';

/** Resolução do mapa (m/célula), igual à de mapas típicos de AMR. */
const RESOLUTION = 0.05;
/** Margem de "desconhecido" em volta da sala (m). */
const MARGIN = 0.5;
const WALL_THICKNESS = 0.1;

// Valores de nav_msgs/OccupancyGrid: -1 desconhecido, 0 livre, 100 ocupado.
const UNKNOWN = -1;
const FREE = 0;
const OCCUPIED = 100;

const originX = -ROOM.halfWidth - MARGIN;
const originY = -ROOM.halfHeight - MARGIN;
const width = Math.round((2 * (ROOM.halfWidth + MARGIN)) / RESOLUTION);
const height = Math.round((2 * (ROOM.halfHeight + MARGIN)) / RESOLUTION);

/** Valor de uma célula a partir da posição do seu centro no mundo. */
function cellValue(x: number, y: number): number {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const insideOuter = ax <= ROOM.halfWidth + WALL_THICKNESS && ay <= ROOM.halfHeight + WALL_THICKNESS;
  const insideInner = ax < ROOM.halfWidth && ay < ROOM.halfHeight;
  if (!insideOuter) return UNKNOWN;
  if (!insideInner) return OCCUPIED; // parede
  if (Math.hypot(x - PILLAR.x, y - PILLAR.y) <= PILLAR.radius) return OCCUPIED;
  return FREE;
}

/**
 * Grade gerada UMA vez (o mapa é estático). Linha 0 = y mínimo, como no ROS:
 * a célula (i, j) fica em `origin + ((i + 0.5) · res, (j + 0.5) · res)`.
 */
const data: number[] = Array.from({ length: width * height }, (_, k) => {
  const i = k % width;
  const j = Math.floor(k / width);
  return cellValue(originX + (i + 0.5) * RESOLUTION, originY + (j + 0.5) * RESOLUTION);
});

/** nav_msgs/msg/OccupancyGrid: mapa da sala demo (paredes + pilar central). */
export const mapTopic: DemoTopic = {
  name: '/map',
  schemaName: 'nav_msgs/msg/OccupancyGrid',
  rateHz: 0.1,
  latched: true,
  build: (_s, timeMs) => ({
    header: makeHeader(timeMs, 'map'),
    info: {
      map_load_time: makeHeader(timeMs, 'map').stamp,
      resolution: RESOLUTION,
      width,
      height,
      origin: {
        position: { x: originX, y: originY, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
    data,
  }),
};
