import type { RosTime, TFMessage } from '@/lib/ros';
import { compose, IDENTITY, interpolate, invert, type Transform } from './transform';

/** Uma leitura de uma transformação, no relógio do ROBÔ (segundos). */
interface Sample {
  time: number;
  /** `T_pai←filho` */
  transform: Transform;
}

interface Edge {
  parent: string;
  /** Frames fixos (/tf_static) valem para qualquer instante: uma amostra só. */
  isStatic: boolean;
  /** Ordenadas por tempo, a mais nova no fim. */
  samples: Sample[];
}

/** Quanto do passado cada transformação guarda (s). Basta cobrir o atraso dos sensores. */
const HISTORY_S = 3;
/** Teto de amostras por aresta (a 100 Hz, 3 s = 300). */
const MAX_SAMPLES = 400;
/** Proteção contra árvore malformada (ciclo). Árvores reais têm < 20 níveis. */
const MAX_DEPTH = 64;

/** O ROS 1 usava "/" na frente dos frames; no ROS 2 não. Normaliza. */
const frameName = (f: string) => (f.startsWith('/') ? f.slice(1) : f);

/** `builtin_interfaces/Time` → segundos (no relógio do robô; pode ser tempo de simulação). */
export function stampToSeconds(stamp: RosTime): number {
  return stamp.sec + stamp.nanosec * 1e-9;
}

/**
 * Árvore de TF: guarda as transformações de cada frame em relação ao pai,
 * com um HISTÓRICO curto, e responde "onde estava o frame X visto do frame Y
 * no instante t".
 *
 *   map ──▶ odom ──▶ base_footprint ──▶ base_link ──▶ base_scan
 *        (AMCL)  (odometria)        (/tf_static, fixos do robô)
 *
 * Por que histórico: um sensor mede num instante e a mensagem chega
 * depois. Para desenhar o scan no lugar certo, ele tem que ser posicionado
 * com a pose do robô NO INSTANTE DA MEDIÇÃO (`header.stamp`), não com a
 * pose de agora. É o que o tf2 do ROS faz com `lookupTransform(…, stamp)`.
 *
 * Cada frame tem UM pai (é uma árvore). Para achar `Y←X`, sobe dos dois
 * até a raiz e combina: `T_Y←X = (T_raiz←Y)⁻¹ ∘ T_raiz←X`.
 */
export class TfTree {
  private readonly edges = new Map<string, Edge>();
  /** Frames presentes AGORA na árvore. */
  private readonly known = new Set<string>();
  /** Frames que já apareceram alguma vez (a lista que a UI mostra). */
  private readonly seen = new Set<string>();
  /** Muda quando aparece um frame nunca visto (para a UI redesenhar a lista). */
  version = 0;

  /** Aplica uma mensagem de /tf (`isStatic` = false) ou /tf_static (true). */
  update(msg: TFMessage, isStatic = false): void {
    for (const ts of msg.transforms) {
      const child = frameName(ts.child_frame_id);
      const parent = frameName(ts.header.frame_id);
      const { translation: t, rotation: r } = ts.transform;
      const sample: Sample = {
        time: stampToSeconds(ts.header.stamp),
        transform: { t: [t.x, t.y, t.z], q: [r.x, r.y, r.z, r.w] },
      };

      const edge = this.edges.get(child);
      if (!edge || edge.parent !== parent || isStatic || edge.isStatic) {
        // Aresta nova, frame que trocou de pai, ou fixa: recomeça o histórico.
        this.edges.set(child, { parent, isStatic, samples: [sample] });
      } else {
        insertSorted(edge.samples, sample);
      }
      this.remember(child);
      this.remember(parent);
    }
  }

  has(frame: string): boolean {
    return this.known.has(frame);
  }

  /** Todos os frames que já apareceram (filhos e pais). */
  frames(): string[] {
    return [...this.seen];
  }

  /** O frame e todos os seus ancestrais até a raiz, ex.: base_footprint, odom, map. */
  chain(frame: string): string[] {
    const out: string[] = [];
    let current: string | undefined = frame;
    while (current !== undefined && out.length < MAX_DEPTH && this.known.has(current)) {
      out.push(current);
      current = this.edges.get(current)?.parent;
    }
    return out;
  }

  /**
   * `T_target←source`, ou undefined se os dois não estão ligados.
   * Sem `time`: o valor mais recente. Com `time` (s, relógio do robô):
   * interpolado no histórico; fora dele, o extremo mais próximo.
   */
  lookup(target: string, source: string, time?: number): Transform | undefined {
    if (target === source) return this.known.has(target) ? IDENTITY : undefined;
    const a = this.toRoot(target, time);
    const b = this.toRoot(source, time);
    if (!a || !b || a.root !== b.root) return undefined;
    return compose(invert(a.transform), b.transform);
  }

  clear(): void {
    this.edges.clear();
    this.known.clear();
    this.seen.clear();
    this.version++;
  }

  /**
   * Esvazia as transformações, mas lembra os frames já vistos (sem mudar
   * `version`). Usado no replay, que reconstrói a árvore a cada posição do
   * cursor: a lista de frames da UI não deve "piscar".
   */
  resetTransforms(): void {
    this.edges.clear();
    this.known.clear();
  }

  /** `T_raiz←frame` subindo pelos pais. */
  private toRoot(frame: string, time: number | undefined): { root: string; transform: Transform } | undefined {
    if (!this.known.has(frame)) return undefined;
    let transform = IDENTITY;
    let current = frame;
    for (let depth = 0; depth < MAX_DEPTH; depth++) {
      const edge = this.edges.get(current);
      if (!edge) return { root: current, transform };
      transform = compose(sampleAt(edge, time), transform);
      current = edge.parent;
    }
    return undefined; // ciclo
  }

  private remember(frame: string): void {
    this.known.add(frame);
    if (this.seen.has(frame)) return;
    this.seen.add(frame);
    this.version++;
  }
}

/** Insere mantendo a ordem por tempo e descarta o que passou do histórico. */
function insertSorted(samples: Sample[], sample: Sample): void {
  let i = samples.length;
  while (i > 0 && samples[i - 1]!.time > sample.time) i--;
  if (i > 0 && samples[i - 1]!.time === sample.time) samples[i - 1] = sample;
  else samples.splice(i, 0, sample);

  const newest = samples[samples.length - 1]!.time;
  let drop = 0;
  while (drop < samples.length - 1 && samples[drop]!.time < newest - HISTORY_S) drop++;
  drop = Math.max(drop, samples.length - MAX_SAMPLES);
  if (drop > 0) samples.splice(0, drop);
}

/** Valor da aresta no instante `time` (busca binária + interpolação). */
function sampleAt(edge: Edge, time: number | undefined): Transform {
  const s = edge.samples;
  const last = s[s.length - 1]!;
  if (time === undefined || edge.isStatic || s.length === 1 || time >= last.time) return last.transform;
  if (time <= s[0]!.time) return s[0]!.transform;

  let lo = 0;
  let hi = s.length - 1; // s[lo].time <= time < s[hi].time
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid]!.time <= time) lo = mid;
    else hi = mid;
  }
  const a = s[lo]!;
  const b = s[hi]!;
  return interpolate(a.transform, b.transform, (time - a.time) / (b.time - a.time));
}
