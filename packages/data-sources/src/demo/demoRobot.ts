/**
 * Estado do robô demo como FUNÇÃO PURA do tempo.
 *
 * O robô percorre uma elipse em volta do pilar central (3 m × 1,8 m).
 * Velocidade e orientação vêm das derivadas analíticas da trajetória, então
 * pose, odometria, IMU e cmd_vel ficam sempre coerentes entre si.
 * Por ser determinístico, o mesmo `t` sempre devolve o mesmo estado.
 */

const A = 3.0; // semieixo em x (m)
const B = 1.8; // semieixo em y (m)
const BASE_RATE = 0.12; // rad/s de avanço na elipse
const RATE_WOBBLE = 0.04; // variação da velocidade, para não ser monótono
const WOBBLE_FREQ = 0.21;

export interface DemoRobotState {
  x: number;
  y: number;
  yaw: number;
  /** Velocidade linear (m/s), no frame do robô. */
  linear: number;
  /** Velocidade angular (rad/s). */
  angular: number;
  /** Aceleração linear (m/s²). */
  accel: number;
  /** Carga da bateria, de 0 a 1. */
  battery: number;
}

/** Fase na elipse (phi) e sua derivada no tempo, no instante t (s). */
function phase(t: number): { phi: number; dphi: number } {
  const w = WOBBLE_FREQ;
  return {
    phi: BASE_RATE * t - (RATE_WOBBLE / w) * Math.cos(w * t),
    dphi: BASE_RATE + RATE_WOBBLE * Math.sin(w * t),
  };
}

function speedAt(phi: number, dphi: number): number {
  return dphi * Math.hypot(A * Math.sin(phi), B * Math.cos(phi));
}

/** @param t segundos desde o início da sessão demo */
export function demoStateAt(t: number): DemoRobotState {
  const { phi, dphi } = phase(t);

  // Posição e derivadas em relação a phi
  const x = A * Math.cos(phi);
  const y = B * Math.sin(phi);
  const xp = -A * Math.sin(phi);
  const yp = B * Math.cos(phi);
  const xpp = -A * Math.cos(phi);
  const ypp = -B * Math.sin(phi);

  // Orientação = direção da tangente; curvatura dá a velocidade angular
  const yaw = Math.atan2(yp, xp);
  const curvature = (xp * ypp - yp * xpp) / Math.pow(xp * xp + yp * yp, 1.5);
  const linear = speedAt(phi, dphi);
  const angular = curvature * linear;

  // Aceleração linear por diferença finita (curta e suficiente para demo)
  const dt = 0.01;
  const next = phase(t + dt);
  const accel = (speedAt(next.phi, next.dphi) - linear) / dt;

  // Bateria descendo devagar a partir de 87 %
  // (t negativo = antes da conexão: bateria um pouco mais cheia, limitada a 100 %)
  const battery = Math.min(1, Math.max(0.05, 0.87 - t * 2e-5));

  return { x, y, yaw, linear, angular, accel, battery };
}
