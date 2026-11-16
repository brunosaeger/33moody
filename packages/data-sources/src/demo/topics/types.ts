import type { DemoRobotState } from '../demoRobot';
import type { Noise } from '../noise';

/**
 * Definição de um tópico sintético do robô demo.
 * Para adicionar um tópico novo: criar um arquivo nesta pasta e registrá-lo em `index.ts`.
 */
export interface DemoTopic<T = unknown> {
  name: string;
  schemaName: string;
  /** Frequência de publicação (Hz). */
  rateHz: number;
  /**
   * Tópico "latched" (durabilidade transient local no ROS2, como /map e
   * /tf_static): quem assina recebe a última mensagem na hora, sem esperar
   * a próxima publicação.
   */
  latched?: boolean;
  /**
   * Monta a mensagem a partir do estado do robô no instante `timeMs` (epoch ms).
   * `noise` vem de fora: aleatório ao vivo, determinístico no replay.
   */
  build(state: DemoRobotState, timeMs: number, noise: Noise): T;
}
