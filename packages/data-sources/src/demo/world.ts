/**
 * Mundo do robô demo: uma sala retangular com um pilar circular no centro.
 * Usado para gerar leituras de LiDAR coerentes com a pose.
 */

export const ROOM = { halfWidth: 5, halfHeight: 3 } as const; // sala de 10 m × 6 m
export const PILLAR = { x: 0, y: 0, radius: 0.4 } as const;

/** Distância do ponto (x, y), na direção `angle`, até a parede mais próxima. */
function rayToWalls(x: number, y: number, angle: number): number {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const tx = dx > 0 ? (ROOM.halfWidth - x) / dx : dx < 0 ? (-ROOM.halfWidth - x) / dx : Infinity;
  const ty = dy > 0 ? (ROOM.halfHeight - y) / dy : dy < 0 ? (-ROOM.halfHeight - y) / dy : Infinity;
  return Math.min(tx, ty);
}

/** Distância até o pilar ao longo do raio (Infinity se não acertar). */
function rayToPillar(x: number, y: number, angle: number): number {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const ox = x - PILLAR.x;
  const oy = y - PILLAR.y;
  // Resolve |o + t·d|² = r²  ->  t² + 2(o·d)t + (|o|² - r²) = 0
  const b = ox * dx + oy * dy;
  const c = ox * ox + oy * oy - PILLAR.radius * PILLAR.radius;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t > 0 ? t : Infinity;
}

/** Raycast no mundo: distância até o primeiro obstáculo. */
export function raycast(x: number, y: number, angle: number): number {
  return Math.min(rayToWalls(x, y, angle), rayToPillar(x, y, angle));
}
