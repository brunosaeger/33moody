import { create } from 'zustand';
import { isRecording, type DataSource, type Unsubscribe } from '@moody/data-sources';
import { DEMO_PROFILE, type RobotProfile } from '@/config/robotProfiles';
import { useClock } from './clockStore';

export type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SessionState {
  /** Fonte de dados ativa (robô ao vivo, replay ou demo). Null = nenhum robô. */
  source: DataSource | null;
  /** Perfil do robô conectado: tópicos, frames e dimensões. */
  profile: RobotProfile;
  status: SessionStatus;
  error: string | null;
  connect: (source: DataSource, profile: RobotProfile) => Promise<void>;
  disconnect: () => void;
}

/** Para de ouvir o estado da conexão da fonte anterior. */
let stopWatching: Unsubscribe | undefined;

/**
 * Sessão de diagnóstico: QUAL fonte de dados está ativa e de qual robô.
 * Uma por vez por enquanto; o multi-robô vem depois.
 */
export const useSession = create<SessionState>((set, get) => ({
  source: null,
  profile: DEMO_PROFILE,
  status: 'disconnected',
  error: null,

  connect: async (source, profile) => {
    stopWatching?.();
    get().source?.stop();
    useClock.getState().goLive(); // conexão nova sempre começa ao vivo
    set({ source: null, status: 'connecting', error: null });
    try {
      await source.start();
    } catch (err) {
      source.stop();
      set({ status: 'error', error: err instanceof Error ? err.message : String(err) });
      return;
    }
    set({ source, profile, status: 'connected' });
    // Gravação não tem "ao vivo": abre direto em replay, no arquivo inteiro.
    if (isRecording(source)) useClock.getState().startReplay(source.recordedRange());

    // Conexão que cai sozinha (robô desligou, rede caiu): volta para a
    // tela de conexão mostrando o motivo.
    stopWatching = source.onStatusChange?.((status) => {
      if (status.state !== 'closed' || get().source !== source) return;
      get().disconnect();
      set({ status: 'error', error: status.reason });
    });
  },

  disconnect: () => {
    stopWatching?.();
    stopWatching = undefined;
    get().source?.stop();
    useClock.getState().goLive(); // sem robô não há replay
    set({ source: null, status: 'disconnected', error: null });
  },
}));

/** Perfil do robô da sessão atual. */
export function useRobotProfile(): RobotProfile {
  return useSession((s) => s.profile);
}
