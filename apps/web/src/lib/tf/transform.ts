/**
 * Transformação rígida 3D (translação + rotação em quaternion), a mesma
 * representação do `geometry_msgs/Transform` do ROS.
 *
 * `T_a←b` leva um ponto escrito no frame b para o frame a.
 * Matemática pura, sem three.js, para ser testável e reaproveitável no
 * motor de replay.
 */
export interface Transform {
  /** Translação [x, y, z] em metros. */
  t: readonly [number, number, number];
  /** Rotação [x, y, z, w] (quaternion unitário). */
  q: readonly [number, number, number, number];
}

export const IDENTITY: Transform = { t: [0, 0, 0], q: [0, 0, 0, 1] };

type Vec = readonly [number, number, number];
type Quat = readonly [number, number, number, number];

/** Gira o vetor v pelo quaternion q. */
export function rotate(q: Quat, v: Vec): [number, number, number] {
  const [qx, qy, qz, qw] = q;
  const [vx, vy, vz] = v;
  // t = 2 * (q.xyz × v);  v' = v + w*t + q.xyz × t
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  return [
    vx + qw * tx + (qy * tz - qz * ty),
    vy + qw * ty + (qz * tx - qx * tz),
    vz + qw * tz + (qx * ty - qy * tx),
  ];
}

function multiply(a: Quat, b: Quat): [number, number, number, number] {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

/** Composição: `T_a←b ∘ T_b←c = T_a←c`. */
export function compose(ab: Transform, bc: Transform): Transform {
  const r = rotate(ab.q, bc.t);
  return { t: [ab.t[0] + r[0], ab.t[1] + r[1], ab.t[2] + r[2]], q: multiply(ab.q, bc.q) };
}

/** Inversa: `T_a←b` → `T_b←a`. */
export function invert(ab: Transform): Transform {
  const q: Quat = [-ab.q[0], -ab.q[1], -ab.q[2], ab.q[3]];
  const t = rotate(q, ab.t);
  return { t: [-t[0], -t[1], -t[2]], q };
}

/** Yaw (rotação em torno de z) de uma transformação. */
export function yawOf(tf: Transform): number {
  const [x, y, z, w] = tf.q;
  return Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
}

/**
 * Transformação "entre" a e b: k = 0 → a, k = 1 → b.
 * Translação linear; rotação por nlerp (interpolação normalizada), que
 * para os ângulos pequenos entre duas amostras de TF equivale ao slerp.
 */
export function interpolate(a: Transform, b: Transform, k: number): Transform {
  const lerp = (x: number, y: number) => x + (y - x) * k;
  // q e -q são a mesma rotação: usa o sinal que dá o caminho mais curto.
  const dot = a.q[0] * b.q[0] + a.q[1] * b.q[1] + a.q[2] * b.q[2] + a.q[3] * b.q[3];
  const s = dot < 0 ? -1 : 1;
  const q = [0, 1, 2, 3].map((i) => lerp(a.q[i]!, s * b.q[i]!)) as [number, number, number, number];
  const n = Math.hypot(...q) || 1;
  return {
    t: [lerp(a.t[0], b.t[0]), lerp(a.t[1], b.t[1]), lerp(a.t[2], b.t[2])],
    q: [q[0] / n, q[1] / n, q[2] / n, q[3] / n],
  };
}
