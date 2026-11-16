import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayersState {
  /** Estado escolhido pelo usuário por camada. Ausente = usa o padrão da camada. */
  enabled: Record<string, boolean>;
  setEnabled: (id: string, on: boolean) => void;
}

/** Quais camadas estão ligadas. Salvo no navegador. */
export const useLayersStore = create<LayersState>()(
  persist(
    (set) => ({
      enabled: {},
      setEnabled: (id, on) => set((s) => ({ enabled: { ...s.enabled, [id]: on } })),
    }),
    { name: 'moody.layers.v1' },
  ),
);

/** A camada está ligada? (escolha do usuário, ou o padrão dela) */
export function isLayerEnabled(enabled: Record<string, boolean>, id: string, defaultEnabled: boolean): boolean {
  return enabled[id] ?? defaultEnabled;
}
