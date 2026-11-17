import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Pontos de interesse de UMA fonte: letra → instante (ms Unix). */
export type MarkerSet = Readonly<Record<string, number>>;

interface MarkersState {
  /** Por fonte (`DataSource.id`): reabrir a mesma gravação traz os pontos de volta. */
  bySource: Readonly<Record<string, MarkerSet>>;
  setMarker: (sourceId: string, letter: string, timeMs: number) => void;
  removeMarker: (sourceId: string, letter: string) => void;
}

const EMPTY: MarkerSet = {};

export const useMarkersStore = create<MarkersState>()(
  persist(
    (set) => ({
      bySource: {},
      setMarker: (sourceId, letter, timeMs) =>
        set((s) => ({ bySource: { ...s.bySource, [sourceId]: { ...s.bySource[sourceId], [letter]: timeMs } } })),
      removeMarker: (sourceId, letter) =>
        set((s) => {
          const { [letter]: _removed, ...rest } = s.bySource[sourceId] ?? EMPTY;
          return { bySource: { ...s.bySource, [sourceId]: rest } };
        }),
    }),
    {
      name: 'moody.markers.v1',
      // Só aceita do armazenamento o formato certo (letra → número).
      merge: (saved, current) => {
        const bySource: Record<string, MarkerSet> = {};
        const raw = (saved as Partial<MarkersState> | undefined)?.bySource;
        if (raw && typeof raw === 'object') {
          for (const [id, set] of Object.entries(raw)) {
            if (!set || typeof set !== 'object') continue;
            bySource[id] = Object.fromEntries(Object.entries(set).filter(([, t]) => typeof t === 'number' && Number.isFinite(t)));
          }
        }
        return { ...current, bySource };
      },
    },
  ),
);

/** Pontos de interesse da fonte informada (vazio se nenhuma). */
export function useSourceMarkers(sourceId: string | undefined): MarkerSet {
  return useMarkersStore((s) => (sourceId ? (s.bySource[sourceId] ?? EMPTY) : EMPTY));
}
