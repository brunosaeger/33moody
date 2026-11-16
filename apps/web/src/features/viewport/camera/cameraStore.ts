import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Presets de câmera do viewport.
 * - orbit: vista inclinada 3/4 da sala, com movimento livre.
 * - follow: acompanha o robô por trás (movimento manual desligado).
 * - top: vista de cima, como um mapa 2D, com pan/zoom livres.
 */
export type CameraPreset = 'orbit' | 'follow' | 'top';

interface CameraState {
  preset: CameraPreset;
  /**
   * Incrementado a cada escolha de preset, mesmo repetida: clicar de novo
   * no preset atual "recentraliza" a câmera.
   */
  revision: number;
  setPreset: (preset: CameraPreset) => void;
}

export const useCameraStore = create<CameraState>()(
  persist(
    (set) => ({
      preset: 'orbit',
      revision: 0,
      setPreset: (preset) => set((s) => ({ preset, revision: s.revision + 1 })),
    }),
    { name: 'moody.camera.v1', partialize: (s) => ({ preset: s.preset }) },
  ),
);
