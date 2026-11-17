import { create } from 'zustand';

interface SceneFrameState {
  /** Frame em que a cena está sendo desenhada agora (null = sem robô/TF). */
  current: string | null;
  /** Frame em que ela DEVERIA estar (o fixo do perfil, ex.: `map`). */
  expected: string | null;
  set: (current: string | null, expected: string | null) => void;
}

/**
 * Ponte entre a cena 3D (que calcula o frame dentro do Canvas, a cada
 * quadro) e a interface 2D fora dela (que avisa quando a cena caiu no
 * plano B). Só muda quando o frame muda, então não custa re-render.
 */
export const useSceneFrame = create<SceneFrameState>((set, get) => ({
  current: null,
  expected: null,
  set: (current, expected) => {
    const s = get();
    if (s.current !== current || s.expected !== expected) set({ current, expected });
  },
}));
