import type { TopicInfo } from '@moody/data-sources';
import { createId } from '@/shared/lib/id';

/**
 * Modelo do QUADRO de componentes: o conteúdo da aba Componentes.
 * Só lógica pura (sem React): funções que recebem um quadro e devolvem outro.
 * Quem guarda e persiste o quadro é o `boardStore.ts`.
 */

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Um componente no quadro: a visualização de UM tópico. */
export interface BoardWidget {
  id: string;
  topic: string;
  schemaName: string;
  layout: WidgetLayout;
}

export interface Board {
  widgets: BoardWidget[];
}

/** Configuração da grade (colunas e altura de linha em px). */
export const GRID = {
  cols: 12,
  rowHeight: 22,
  margin: [6, 6] as const,
} as const;

export const DEFAULT_WIDGET_SIZE = { w: 12, h: 8 } as const;
export const MIN_WIDGET_SIZE = { w: 3, h: 3 } as const;

function isWidget(v: unknown): v is BoardWidget {
  if (typeof v !== 'object' || v === null) return false;
  const w = v as Partial<BoardWidget>;
  return typeof w.id === 'string' && typeof w.topic === 'string' && typeof w.layout === 'object';
}

export const EMPTY_BOARD: Board = { widgets: [] };

/** Valida um quadro vindo de fora (storage), tolerando dado ausente ou antigo. */
export function parseBoard(raw: unknown): Board {
  const widgets = (raw as Partial<Board> | undefined)?.widgets;
  return Array.isArray(widgets) ? { widgets: widgets.filter(isWidget) } : EMPTY_BOARD;
}

/** Adiciona o componente de um tópico no fim do quadro. */
export function addWidget(board: Board, topic: TopicInfo): Board {
  const bottom = board.widgets.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0);
  const widget: BoardWidget = {
    id: createId('w-'),
    topic: topic.name,
    schemaName: topic.schemaName,
    layout: { x: 0, y: bottom, ...DEFAULT_WIDGET_SIZE },
  };
  return { widgets: [...board.widgets, widget] };
}

export function removeWidget(board: Board, id: string): Board {
  return { widgets: board.widgets.filter((w) => w.id !== id) };
}

/**
 * Aplica posições e tamanhos vindos da grade.
 * Devolve null se nada mudou, para não disparar um salvamento à toa
 * (a grade chama onLayoutChange também na montagem).
 */
export function applyLayout(board: Board, layout: readonly ({ i: string } & WidgetLayout)[]): Board | null {
  const byId = new Map(layout.map((l) => [l.i, l]));
  let changed = false;
  const widgets = board.widgets.map((w) => {
    const l = byId.get(w.id);
    if (!l) return w;
    const { x, y, w: width, h } = l;
    if (x === w.layout.x && y === w.layout.y && width === w.layout.w && h === w.layout.h) return w;
    changed = true;
    return { ...w, layout: { x, y, w: width, h } };
  });
  return changed ? { widgets } : null;
}
