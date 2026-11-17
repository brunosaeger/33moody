import { create } from 'zustand';

interface StepperState {
  /** Tópico escolhido para andar mensagem por mensagem (null = padrão do perfil). */
  topic: string | null;
  setTopic: (topic: string) => void;
}

/**
 * Tópico do passo de mensagem. Fica num store (e não no componente) porque
 * os botões ⏮ ⏭ e as teclas `,` `.` usam o MESMO tópico.
 */
export const useStepperStore = create<StepperState>((set) => ({
  topic: null,
  setTopic: (topic) => set({ topic }),
}));
