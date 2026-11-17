import { useEffect } from 'react';
import { isKeyboardBusy } from '@/shared/lib/keyboard';
import { markerKeyFromCode } from './keys';
import { onMarkerKey } from './actions';

/**
 * Pontos de interesse pelo teclado (ao vivo e no replay):
 *   Q … M         1º toque marca o instante atual; os seguintes levam até ele (pausado)
 *   Shift + letra  redefine o ponto para o instante atual
 * Usa a tecla FÍSICA (`code`), então funciona em qualquer layout de teclado.
 */
export function useMarkerHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || isKeyboardBusy(e)) return;
      const letter = markerKeyFromCode(e.code);
      if (!letter) return;
      e.preventDefault();
      onMarkerKey(letter, e.shiftKey);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
