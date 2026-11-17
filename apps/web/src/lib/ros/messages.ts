/**
 * Tipos TypeScript das mensagens ROS2 que a UI interpreta.
 * Só os campos usados; a mensagem decodificada pode ter mais.
 */

export interface RosVector3 {
  x: number;
  y: number;
  z: number;
}

export interface RosQuaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface RosPose {
  position: RosVector3;
  orientation: RosQuaternion;
}

/** builtin_interfaces/msg/Time (ROS 2) */
export interface RosTime {
  sec: number;
  nanosec: number;
}

/** std_msgs/msg/Header */
export interface RosHeader {
  stamp: RosTime;
  frame_id: string;
}

/** geometry_msgs/msg/Twist */
export interface Twist {
  linear: RosVector3;
  angular: RosVector3;
}

/** geometry_msgs/msg/TwistStamped (o Nav2 pode publicar o cmd_vel assim) */
export interface TwistStamped {
  header: RosHeader;
  twist: Twist;
}

/** Aceita Twist ou TwistStamped e devolve o Twist. */
export function twistOf(msg: Twist | TwistStamped | undefined): Twist | undefined {
  if (!msg) return undefined;
  return 'twist' in msg ? msg.twist : msg;
}

/** geometry_msgs/msg/TransformStamped */
export interface TransformStamped {
  header: RosHeader;
  child_frame_id: string;
  transform: { translation: RosVector3; rotation: RosQuaternion };
}

/** tf2_msgs/msg/TFMessage (tópicos /tf e /tf_static) */
export interface TFMessage {
  transforms: TransformStamped[];
}

/** nav_msgs/msg/Odometry */
export interface Odometry {
  pose: { pose: RosPose };
  twist: { twist: Twist };
}

/** sensor_msgs/msg/LaserScan */
export interface LaserScan {
  header: RosHeader;
  angle_min: number;
  angle_increment: number;
  range_min: number;
  range_max: number;
  ranges: ArrayLike<number>;
}

/** nav_msgs/msg/OccupancyGrid */
export interface OccupancyGrid {
  info: {
    resolution: number;
    width: number;
    height: number;
    origin: RosPose;
  };
  /** -1 desconhecido, 0..100 probabilidade de ocupação. Linha 0 = y mínimo. */
  data: ArrayLike<number>;
}

/** Ângulo de rotação em torno de Z (yaw, rad) de um quaternion. */
export function quaternionToYaw(q: RosQuaternion): number {
  return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
}
