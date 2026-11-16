import { create } from 'zustand';
import type { DataSource } from '@moody/data-sources';
import { useClock } from './clockStore';

export type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SessionState {
  /** Fonte de dados ativa (robô ao vivo, replay ou demo). Null = nenhum robô. */
  source: DataSource | null;
  status: SessionStatus;
  error: string | null;
  connect: (source: DataSource) => Promise<void>;
  disconnect: () => void;
}

/**
 * Sessão de diagnóstico: QUAL fonte de dados está ativa.
 * Uma por vez por enquanto; o multi-robô vem depois.
 */
export const useSession = create<SessionState>((set, get) => ({
  source: null,
  status: 'disconnected',
  error: null,

  connect: async (source) => {
    get().source?.stop();
    useClock.getState().goLive(); // conexão nova sempre começa ao vivo
    set({ source: null, status: 'connecting', error: null });
    try {
      await source.start();
      set({ source, status: 'connected' });
    } catch (err) {
      source.stop();
      set({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  },

  disconnect: () => {
    get().source?.stop();
    useClock.getState().goLive(); // sem robô não há replay
    set({ source: null, status: 'disconnected', error: null });
  },
}));
