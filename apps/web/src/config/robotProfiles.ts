/**
 * Perfil do robô: TUDO o que é específico de um robô (tópicos, frames,
 * dimensões) fica aqui, nunca espalhado pelo código.
 *
 * Por enquanto os perfis são escritos em TS. Quando o robô alvo for
 * definido, virão de YAML (`config/robots/*.yaml`) escolhido na conexão.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * De onde vem a pose do robô na cena.
 * - `odometry`: direto da mensagem de odometria. Só serve quando ela já
 *   está no frame fixo da cena (caso do robô demo).
 * - `tf`: compondo a árvore de TF, como o RViz. Num robô real a odometria
 *   acumula erro e quem corrige é a localização (AMCL), publicando
 *   `map → odom`; a pose certa no mapa é `map → odom → base_footprint`.
 */
export type PoseSource =
  | { kind: 'odometry' }
  | {
      kind: 'tf';
      /** Frame fixo da cena (o "Fixed Frame" do RViz), ex.: `map`. */
      fixedFrame: string;
      /** Frame do robô no chão, ex.: `base_footprint`. */
      baseFrame: string;
      /** Se o fixo ainda não existe (AMCL sem pose inicial), usa este. */
      fallbackFrame?: string;
    };

export interface RobotProfile {
  id: string;
  label: string;
  topics: {
    /** Odometria (nav_msgs/Odometry): velocidade medida e, no demo, a pose. */
    odom: string;
    /** LiDAR 2D (sensor_msgs/LaserScan). */
    scan: string;
    /** Mapa (nav_msgs/OccupancyGrid). */
    map: string;
    /** Velocidade comandada (geometry_msgs/Twist ou TwistStamped). */
    cmdVel: string;
  };
  pose: PoseSource;
  /** Dimensões do modelo genérico (m), usado enquanto não há URDF. */
  body: { length: number; width: number; height: number; wheelRadius: number };
  /**
   * Posição do LiDAR em relação ao frame do robô (m). Com TF disponível,
   * vale o TF do frame do scan; isto é só o plano B.
   */
  laserOffset: Vec3;
}

export const DEMO_PROFILE: RobotProfile = {
  id: 'demo',
  label: 'Robô demo',
  topics: { odom: '/odom', scan: '/scan', map: '/map', cmdVel: '/cmd_vel' },
  pose: { kind: 'odometry' },
  body: { length: 0.6, width: 0.45, height: 0.25, wheelRadius: 0.08 },
  // x = 0: o LiDAR do demo faz o raycast a partir do centro do robô.
  laserOffset: { x: 0, y: 0, z: 0.36 },
};

/**
 * TurtleBot3 Waffle, como sobe na simulação do Nav2
 * (`ros2 launch nav2_bringup tb3_simulation_launch.py`).
 * Dimensões e laser conferidos no /tf_static da simulação (2026-11-17).
 */
export const TB3_WAFFLE_PROFILE: RobotProfile = {
  id: 'turtlebot3-waffle',
  label: 'TurtleBot3 Waffle',
  topics: { odom: '/odom', scan: '/scan', map: '/map', cmdVel: '/cmd_vel' },
  pose: { kind: 'tf', fixedFrame: 'map', baseFrame: 'base_footprint', fallbackFrame: 'odom' },
  body: { length: 0.281, width: 0.306, height: 0.141, wheelRadius: 0.033 },
  laserOffset: { x: -0.064, y: 0, z: 0.132 },
};

/** Perfis que podem ser escolhidos ao conectar num robô real. */
export const LIVE_ROBOT_PROFILES: readonly RobotProfile[] = [TB3_WAFFLE_PROFILE];

/** Tópicos que definem a pose (para exibir na aba Camadas). */
export function poseTopics(profile: RobotProfile): string[] {
  return profile.pose.kind === 'tf' ? ['/tf'] : [profile.topics.odom];
}
