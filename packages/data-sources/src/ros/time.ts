/** `builtin_interfaces/msg/Time` do ROS2. */
export interface RosTime {
  sec: number;
  nanosec: number;
}

/** `std_msgs/msg/Header` do ROS2. */
export interface RosHeader {
  stamp: RosTime;
  frame_id: string;
}

export function msToRosTime(ms: number): RosTime {
  const sec = Math.floor(ms / 1000);
  return { sec, nanosec: Math.round((ms - sec * 1000) * 1e6) };
}

export function rosTimeToMs(t: RosTime): number {
  return t.sec * 1000 + t.nanosec / 1e6;
}

export function makeHeader(ms: number, frameId: string): RosHeader {
  return { stamp: msToRosTime(ms), frame_id: frameId };
}
