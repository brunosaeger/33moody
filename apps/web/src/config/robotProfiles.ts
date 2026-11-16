/**
 * Perfil do robô: TUDO o que é específico de um robô (tópicos, frames,
 * dimensões) fica aqui, nunca espalhado pelo código.
 *
 * Hoje só existe o perfil do robô demo. Quando o robô alvo for definido,
 * o perfil virá de um YAML (`config/robots/*.yaml`) escolhido na conexão.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface RobotProfile {
  id: string;
  label: string;
  topics: {
    /** Pose do robô (nav_msgs/Odometry). */
    pose: string;
    /** LiDAR 2D (sensor_msgs/LaserScan). */
    scan: string;
    /** Mapa (nav_msgs/OccupancyGrid). */
    map: string;
    /** Velocidade comandada (geometry_msgs/Twist). */
    cmdVel: string;
  };
  /** Dimensões do modelo genérico (m), usado enquanto não há URDF. */
  body: { length: number; width: number; height: number };
  /** Posição do LiDAR em relação ao base_link (m). */
  laserOffset: Vec3;
}

export const DEMO_PROFILE: RobotProfile = {
  id: 'demo',
  label: 'Robô demo',
  topics: {
    pose: '/odom',
    scan: '/scan',
    map: '/map',
    cmdVel: '/cmd_vel',
  },
  body: { length: 0.6, width: 0.45, height: 0.25 },
  // x = 0: o LiDAR do demo faz o raycast a partir do centro do robô.
  laserOffset: { x: 0, y: 0, z: 0.36 },
};

/** Perfil do robô conectado. Por enquanto, sempre o demo. */
export function useRobotProfile(): RobotProfile {
  return DEMO_PROFILE;
}
