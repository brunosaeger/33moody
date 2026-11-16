import { useEffect, useState } from 'react';
import { supportsReplay, type MessageEvent } from '@moody/data-sources';
import { followTopic, useClock, useSession } from '@/data';
import type { Odometry } from '@/lib/ros';

export type TrailPoint = [x: number, y: number, z: number];

/** Ao vivo: quanto do passado o rastro guarda. */
const LIVE_WINDOW_MS = 3 * 60 * 1000;
/** Ao vivo: só registra um ponto novo se o robô andou pelo menos isto (m). */
const MIN_STEP_M = 0.02;
/** Ritmo de atualização do desenho (o rastro não precisa de 60 fps). */
const REFRESH_MS = 150;
/** Replay: máximo de amostras entre o início da faixa e o cursor. */
const MAX_REPLAY_SAMPLES = 800;
const MIN_REPLAY_STEP_MS = 100;
/** Levemente acima do chão/mapa. */
const TRAIL_Z = 0.01;

function toPoint(event: MessageEvent | undefined): TrailPoint | null {
  const p = (event?.message as Odometry | undefined)?.pose.pose.position;
  return p ? [p.x, p.y, TRAIL_Z] : null;
}

/**
 * Pontos do rastro do robô.
 * - Ao vivo: acumula as poses recebidas nos últimos minutos.
 * - Replay: reconstrói o caminho do início da faixa até o cursor,
 *   amostrando a fonte (`messageAt`) em intervalos regulares.
 */
export function useTrail(poseTopic: string): TrailPoint[] {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  const [points, setPoints] = useState<TrailPoint[]>([]);

  // AO VIVO
  useEffect(() => {
    setPoints([]);
    if (!source || mode !== 'live') return;
    const buffer: { t: number; p: TrailPoint }[] = [];

    const stop = followTopic(source, poseTopic, 'live', (event) => {
      const p = toPoint(event);
      if (!p || !event) return;
      const last = buffer[buffer.length - 1];
      if (last && Math.hypot(p[0] - last.p[0], p[1] - last.p[1]) < MIN_STEP_M) return;
      buffer.push({ t: event.timeMs, p });
    });

    const timer = setInterval(() => {
      const cutoff = Date.now() - LIVE_WINDOW_MS;
      while (buffer.length > 0 && buffer[0]!.t < cutoff) buffer.shift();
      setPoints(buffer.map((b) => b.p));
    }, REFRESH_MS);

    return () => {
      stop();
      clearInterval(timer);
    };
  }, [source, mode, poseTopic]);

  // REPLAY
  useEffect(() => {
    if (!source || mode !== 'replay' || !supportsReplay(source)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const rebuild = () => {
      timer = undefined;
      const { range, cursorMs } = useClock.getState();
      if (!range) return;
      const span = Math.max(0, cursorMs - range.startMs);
      const step = Math.max(MIN_REPLAY_STEP_MS, span / MAX_REPLAY_SAMPLES);
      const pts: TrailPoint[] = [];
      for (let t = range.startMs; t <= cursorMs; t += step) {
        const p = toPoint(source.messageAt(poseTopic, t));
        if (p) pts.push(p);
      }
      const end = toPoint(source.messageAt(poseTopic, cursorMs));
      if (end) pts.push(end);
      setPoints(pts);
    };

    rebuild();
    const unsubscribe = useClock.subscribe((s, prev) => {
      if ((s.cursorMs !== prev.cursorMs || s.range !== prev.range) && !timer) {
        timer = setTimeout(rebuild, REFRESH_MS);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [source, mode, poseTopic]);

  return points;
}
