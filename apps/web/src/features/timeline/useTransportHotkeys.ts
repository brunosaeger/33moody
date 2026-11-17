import { useEffect } from 'react';
import { useClock } from '@/data';
import { isKeyboardBusy as isTyping } from '@/shared/lib/keyboard';
import { shiftSpeed, startScrub, stepMessage } from './transport';

/** Toque mais curto que isto é um "clique" na seta (pula 1 s); mais longo, avanço contínuo. */
const HOLD_DELAY_MS = 250;
const TAP_SKIP_S = 1;


/**
 * Atalhos do replay (só valem no modo replay):
 *
 *   Espaço   play / pause
 *   → / ←    toque: ±1 s · segurar: avança/volta a 2×, depois 4×, depois 8×
 *   ↑ / ↓    velocidade seguinte / anterior (entre as predefinidas)
 *   . / ,    mensagem seguinte / anterior do tópico do passo
 *
 * Ignorados enquanto se digita (campos, listas) ou se outro elemento já
 * usou a tecla (`defaultPrevented`, ex.: o divisor do menu lateral).
 */
export function useTransportHotkeys(): void {
  useEffect(() => {
    let held: { direction: 1 | -1; timer: ReturnType<typeof setTimeout>; stop?: () => void } | null = null;

    const release = (tap: boolean) => {
      if (!held) return;
      clearTimeout(held.timer);
      if (held.stop) held.stop();
      else if (tap) useClock.getState().skip(held.direction * TAP_SKIP_S);
      held = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isTyping(e) || useClock.getState().mode !== 'replay') return;

      switch (e.key) {
        case ' ':
          e.preventDefault(); // não rola a página nem "clica" o botão focado
          if (!e.repeat) useClock.getState().togglePlay();
          return;
        case 'ArrowRight':
        case 'ArrowLeft': {
          e.preventDefault();
          if (e.repeat || held) return; // a repetição do teclado não conta: o "segurar" é nosso
          const direction = e.key === 'ArrowRight' ? 1 : -1;
          held = { direction, timer: setTimeout(() => held && (held.stop = startScrub(direction)), HOLD_DELAY_MS) };
          return;
        }
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          shiftSpeed(e.key === 'ArrowUp' ? 1 : -1);
          return;
        case '.':
        case ',':
          e.preventDefault();
          stepMessage(e.key === '.' ? 1 : -1);
          return;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isTyping(e)) e.preventDefault();
      if (held && e.key === (held.direction === 1 ? 'ArrowRight' : 'ArrowLeft')) release(true);
    };

    // Perder o foco com a seta segurada (ex.: Alt+Tab) não pode deixar o avanço rodando.
    const onBlur = () => release(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      release(false);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
}
