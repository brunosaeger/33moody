import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TopicInfo } from '@moody/data-sources';
import { addWidget, applyLayout, EMPTY_BOARD, parseBoard, removeWidget, type Board, type WidgetLayout } from './board';

interface BoardState {
  board: Board;
  addTopic: (topic: TopicInfo) => void;
  removeWidget: (id: string) => void;
  /** Recebe posições/tamanhos da grade; só grava se algo mudou. */
  applyLayout: (layout: readonly ({ i: string } & WidgetLayout)[]) => void;
}

/**
 * Estado do quadro de componentes, salvo no navegador.
 * As ações só delegam para as funções puras de `board.ts`.
 */
export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      board: EMPTY_BOARD,
      addTopic: (topic) => set({ board: addWidget(get().board, topic) }),
      removeWidget: (id) => set({ board: removeWidget(get().board, id) }),
      applyLayout: (layout) => {
        const next = applyLayout(get().board, layout);
        if (next) set({ board: next });
      },
    }),
    {
      name: 'moody.component-board.v1',
      partialize: (s) => ({ board: s.board }),
      // Dado salvo passa pela validação antes de virar estado.
      merge: (persisted, current) => ({
        ...current,
        board: parseBoard((persisted as { board?: unknown } | undefined)?.board),
      }),
    },
  ),
);
