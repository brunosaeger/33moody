/** Tipos e helpers de `geometry_msgs` usados por várias fontes. */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Quaternion de uma rotação em torno de Z (yaw), o caso de robôs no plano. */
export function yawToQuaternion(yaw: number): Quaternion {
  return { x: 0, y: 0, z: Math.sin(yaw / 2), w: Math.cos(yaw / 2) };
}
