import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Limites de largura do menu lateral (px). */
export const SIDEBAR_WIDTH = {
  default: 340,
  min: 260,
  max: 900,
} as const;

/** A área do viewport nunca fica mais estreita que isto ao alargar o menu. */
export const MIN_VIEWPORT_WIDTH = 480;

interface SidebarState {
  activeTabId: string | null;
  width: number;
  setActiveTab: (id: string) => void;
  setWidth: (width: number) => void;
}

/** Estado do menu lateral: aba ativa e largura. Salvo no navegador. */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      activeTabId: null,
      width: SIDEBAR_WIDTH.default,
      setActiveTab: (activeTabId) => set({ activeTabId }),
      setWidth: (width) => set({ width }),
    }),
    { name: 'moody.sidebar.v1' },
  ),
);
