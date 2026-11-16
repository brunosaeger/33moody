import type { DemoRobotState } from './demoRobot';

/**
 * "Agitação" artificial aplicada ao estado do robô demo no REPLAY.
 *
 * Ao vivo, os valores variam pouco (robô em regime). No replay, para a
 * demonstração ficar visível ao arrastar o cursor, somamos oscilações mais
 * rápidas e mais fortes: velocidade, giro, aceleração e bateria passam a
 * "mexer" a cada segundo percorrido.
 *
 * É função pura do tempo: o mesmo instante sempre gera o mesmo estado.
 * Só existe no robô demo e não representa dado real.
 */
export function agitate(s: DemoRobotState, t: number): DemoRobotState {
  return {
    ...s,
    linear: s.linear + 0.18 * Math.sin(t * 1.7) + 0.07 * Math.sin(t * 5.3),
    angular: s.angular + 0.25 * Math.sin(t * 2.9) + 0.08 * Math.sin(t * 7.1),
    accel: s.accel + 0.6 * Math.sin(t * 4.1) + 0.25 * Math.sin(t * 9.7),
    battery: Math.min(1, Math.max(0.05, s.battery + 0.03 * Math.sin(t * 0.9))),
  };
}
