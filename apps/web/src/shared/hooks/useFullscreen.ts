import { useCallback, useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
};
const isFullscreenNow = () => document.fullscreenElement !== null;

/**
 * Tela cheia do navegador (Fullscreen API) para a página inteira.
 * Acompanha também a saída por fora do app (Esc, F11), via `fullscreenchange`.
 */
export function useFullscreen(): { isFullscreen: boolean; supported: boolean; toggle: () => void } {
  const isFullscreen = useSyncExternalStore(subscribe, isFullscreenNow);
  const supported = document.fullscreenEnabled;

  const toggle = useCallback(() => {
    // Falha (ex.: bloqueado pelo navegador) não deve quebrar a tela: só não muda.
    const request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    request.catch(() => {});
  }, []);

  return { isFullscreen, supported, toggle };
}
