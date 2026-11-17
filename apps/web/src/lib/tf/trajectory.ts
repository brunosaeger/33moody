import type { TFMessage } from '@/lib/ros';
import { TfTree } from './TfTree';
import type { Transform } from './transform';

export interface TimedTf {
  /** Instante na timeline (ms Unix). */
  timeMs: number;
  message: TFMessage;
}

export interface TrajectoryPoint {
  timeMs: number;
  x: number;
  y: number;
}

/**
 * Trajetória de um frame ao longo de uma gravação, reconstruída da árvore
 * de TF: percorre as mensagens de /tf em ordem, atualizando a árvore, e
 * amostra a pose a cada `stepMs`.
 *
 * `pick` decide QUAL pose amostrar (ex.: `map ← base_footprint`, ou `odom`
 * se o `map` ainda não existe naquele instante).
 */
export function trajectoryFromTf(
  staticMessages: readonly TFMessage[],
  dynamic: readonly TimedTf[],
  pick: (tree: TfTree) => Transform | undefined,
  stepMs: number,
): TrajectoryPoint[] {
  const tree = new TfTree();
  for (const m of staticMessages) tree.update(m, true);

  const out: TrajectoryPoint[] = [];
  let next = -Infinity;
  for (const { timeMs, message } of dynamic) {
    tree.update(message);
    if (timeMs < next) continue;
    const tf = pick(tree);
    if (!tf) continue;
    out.push({ timeMs, x: tf.t[0], y: tf.t[1] });
    next = timeMs + stepMs;
  }
  return out;
}
