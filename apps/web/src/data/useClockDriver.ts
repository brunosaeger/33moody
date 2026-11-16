import { useEffect } from 'react';
import { useClock } from './clockStore';

/**
 * "Motor" do play: enquanto estiver tocando, avança o cursor a cada frame
 * (tempo real × velocidade) e para sozinho no fim da faixa.
 * Montar UMA vez (a timeline monta).
 */
export function useClockDriver(): void {
  const playing = useClock((s) => s.playing);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();

    const step = (now: number) => {
      const { cursorMs, speed, range, seek, setPlaying } = useClock.getState();
      const next = cursorMs + (now - last) * speed;
      last = now;
      if (range && next >= range.endMs) {
        seek(range.endMs);
        setPlaying(false);
        return;
      }
      seek(next);
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
}
