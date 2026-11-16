/**
 * Achata uma mensagem ROS (objeto aninhado) em linhas para exibição em árvore.
 *
 *   { header: { frame_id: 'odom' }, ranges: [360 números] }
 *   ->
 *   header              (grupo, depth 0)
 *     frame_id  "odom"  (depth 1)
 *   ranges  [360] min 0.41 · máx 5.12
 *
 * Arrays grandes viram um resumo: 360 linhas de LiDAR não ajudam ninguém.
 */

export type FieldKind = 'group' | 'number' | 'string' | 'boolean' | 'array' | 'null';

export interface FieldRow {
  /** Caminho completo, ex.: `pose.pose.position.x` (chave estável para o React). */
  path: string;
  /** Nome do campo nesta linha, ex.: `x`. */
  name: string;
  depth: number;
  kind: FieldKind;
  /** Valor formatado; vazio para grupos. */
  value: string;
}

/** Arrays numéricos até este tamanho são mostrados por inteiro. */
const MAX_INLINE_ARRAY = 6;
const DECIMALS = 3;

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return Number.isInteger(n) ? String(n) : n.toFixed(DECIMALS);
}

function summarizeArray(arr: readonly unknown[]): string {
  if (arr.length === 0) return '[]';
  if (arr.every((v) => typeof v === 'number')) {
    const nums = arr as readonly number[];
    if (nums.length <= MAX_INLINE_ARRAY) return `[${nums.map(formatNumber).join(', ')}]`;
    let min = Infinity;
    let max = -Infinity;
    for (const n of nums) {
      if (n < min) min = n;
      if (n > max) max = n;
    }
    return `[${nums.length}] mín ${formatNumber(min)} · máx ${formatNumber(max)}`;
  }
  return `[${arr.length} itens]`;
}

function walk(value: unknown, name: string, path: string, depth: number, out: FieldRow[]): void {
  if (value === null || value === undefined) {
    out.push({ path, name, depth, kind: 'null', value: '—' });
  } else if (typeof value === 'number') {
    out.push({ path, name, depth, kind: 'number', value: formatNumber(value) });
  } else if (typeof value === 'bigint') {
    out.push({ path, name, depth, kind: 'number', value: value.toString() });
  } else if (typeof value === 'boolean') {
    out.push({ path, name, depth, kind: 'boolean', value: value ? 'true' : 'false' });
  } else if (typeof value === 'string') {
    out.push({ path, name, depth, kind: 'string', value: `"${value}"` });
  } else if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    const arr = Array.isArray(value) ? value : Array.from(value as unknown as ArrayLike<number>);
    out.push({ path, name, depth, kind: 'array', value: summarizeArray(arr) });
  } else if (typeof value === 'object') {
    if (depth >= 0) out.push({ path, name, depth, kind: 'group', value: '' });
    for (const [key, child] of Object.entries(value)) {
      walk(child, key, path ? `${path}.${key}` : key, depth + 1, out);
    }
  } else {
    out.push({ path, name, depth, kind: 'string', value: String(value) });
  }
}

/** Linhas de exibição de uma mensagem. Os campos de primeiro nível ficam em depth 0. */
export function flattenMessage(message: unknown): FieldRow[] {
  const out: FieldRow[] = [];
  walk(message, '', '', -1, out);
  return out;
}
