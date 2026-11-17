import type { TFMessage } from '@/lib/ros';
import { compose, IDENTITY, invert, type Transform } from './transform';

interface Edge {
  parent: string;
  /** `T_pai←filho` */
  transform: Transform;
}

/** Proteção contra árvore malformada (ciclo). Árvores reais têm < 20 níveis. */
const MAX_DEPTH = 64;

/** O ROS 1 usava "/" na frente dos frames; no ROS 2 não. Normaliza. */
const frameName = (f: string) => (f.startsWith('/') ? f.slice(1) : f);

/**
 * Árvore de TF: guarda a transformação mais recente de cada frame em
 * relação ao pai e responde "onde está o frame X visto do frame Y".
 *
 *   map ──▶ odom ──▶ base_footprint ──▶ base_link ──▶ base_scan
 *        (AMCL)  (odometria)        (/tf_static, fixos do robô)
 *
 * Cada frame tem UM pai (é uma árvore). Para achar `Y←X`, sobe dos dois
 * até a raiz e combina: `T_Y←X = (T_raiz←Y)⁻¹ ∘ T_raiz←X`.
 *
 * Por enquanto guarda só o ÚLTIMO valor (ao vivo). Para replay com
 * interpolação no tempo, vira um buffer por frame no motor de replay.
 */
export class TfTree {
  private readonly edges = new Map<string, Edge>();
  private readonly known = new Set<string>();
  /** Muda quando aparece um frame novo (para a UI redesenhar a lista). */
  version = 0;

  /** Aplica uma mensagem de /tf ou /tf_static. */
  update(msg: TFMessage): void {
    for (const ts of msg.transforms) {
      const child = frameName(ts.child_frame_id);
      const parent = frameName(ts.header.frame_id);
      const { translation: t, rotation: r } = ts.transform;
      this.edges.set(child, { parent, transform: { t: [t.x, t.y, t.z], q: [r.x, r.y, r.z, r.w] } });
      this.remember(child);
      this.remember(parent);
    }
  }

  has(frame: string): boolean {
    return this.known.has(frame);
  }

  /** Todos os frames conhecidos (filhos e pais). */
  frames(): string[] {
    return [...this.known];
  }

  /** `T_target←source`, ou undefined se os dois não estão ligados. */
  lookup(target: string, source: string): Transform | undefined {
    if (target === source) return this.known.has(target) ? IDENTITY : undefined;
    const a = this.toRoot(target);
    const b = this.toRoot(source);
    if (!a || !b || a.root !== b.root) return undefined;
    return compose(invert(a.transform), b.transform);
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

  clear(): void {
    this.edges.clear();
    this.known.clear();
    this.version++;
  }

  /** `T_raiz←frame` subindo pelos pais. */
  private toRoot(frame: string): { root: string; transform: Transform } | undefined {
    if (!this.known.has(frame)) return undefined;
    let transform = IDENTITY;
    let current = frame;
    for (let depth = 0; depth < MAX_DEPTH; depth++) {
      const edge = this.edges.get(current);
      if (!edge) return { root: current, transform };
      transform = compose(edge.transform, transform);
      current = edge.parent;
    }
    return undefined; // ciclo
  }

  private remember(frame: string): void {
    if (this.known.has(frame)) return;
    this.known.add(frame);
    this.version++;
  }
}
