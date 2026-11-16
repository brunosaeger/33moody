import { create } from 'zustand';

/**
 * Relógio da sessão: QUAL instante a tela está mostrando.
 *
 * - `live`: o presente. Os dados chegam pela assinatura da fonte.
 * - `replay`: um instante dentro de uma faixa passada (`cursorMs`).
 *   Os dados são reconstruídos pela fonte (`messageAt`).
 *
 * Viewport, componentes e timeline leem daqui; nenhum deles sabe de onde
 * os dados vêm.
 */

export type ClockMode = 'live' | 'replay';

export interface TimeRange {
  startMs: number;
  endMs: number;
}

/** Velocidades de reprodução oferecidas na timeline. */
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;

interface ClockState {
  mode: ClockMode;
  /** Faixa do replay (null ao vivo). */
  range: TimeRange | null;
  /** Instante mostrado no replay (epoch ms). Ao vivo, não é usado. */
  cursorMs: number;
  playing: boolean;
  speed: number;

  /** Entra no replay com o cursor no início da faixa (pausado). */
  startReplay: (range: TimeRange) => void;
  goLive: () => void;
  /** Move o cursor (limitado à faixa). */
  seek: (ms: number) => void;
  /** Pula para frente (+) ou para trás (−), em segundos. */
  skip: (seconds: number) => void;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
}

function clampToRange(ms: number, range: TimeRange | null): number {
  if (!range) return ms;
  return Math.min(range.endMs, Math.max(range.startMs, ms));
}

export const useClock = create<ClockState>((set, get) => ({
  mode: 'live',
  range: null,
  cursorMs: Date.now(),
  playing: false,
  speed: 1,

  startReplay: (range) => set({ mode: 'replay', range, cursorMs: range.startMs, playing: false }),

  goLive: () => set({ mode: 'live', range: null, playing: false }),

  seek: (ms) => set({ cursorMs: clampToRange(ms, get().range) }),

  skip: (seconds) => {
    const { mode, cursorMs, range } = get();
    if (mode !== 'replay') return;
    set({ cursorMs: clampToRange(cursorMs + seconds * 1000, range) });
  },

  setPlaying: (playing) => set({ playing: get().mode === 'replay' && playing }),

  togglePlay: () => {
    const { mode, playing, cursorMs, range } = get();
    if (mode !== 'replay' || !range) return;
    // Play no fim da faixa recomeça do início.
    if (!playing && cursorMs >= range.endMs) set({ cursorMs: range.startMs });
    set({ playing: !playing });
  },

  setSpeed: (speed) => set({ speed }),
}));
