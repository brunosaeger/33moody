import { useEffect, useState, type RefObject } from 'react';
import { supportsReplay, type MessageEvent } from '@moody/data-sources';
import { useClock, useSession } from '@/data';
import type { Odometry } from '@/lib/ros';
import type { Pose2D } from '@/lib/scene3d';

export type TrailPoint = [x: number, y: number, z: number];

/** Ao vivo: quanto do passado o rastro guarda. */
const LIVE_WINDOW_MS = 3 * 60 * 1000;
/** Ao vivo: só registra um ponto novo se o robô andou pelo menos isto (m). */
const MIN_STEP_M = 0.02;
/**
 * Ao vivo: um salto maior que isto entre amostras não é movimento, é
 * troca de referência (ex.: o `map` apareceu, ou a localização corrigiu a
 * pose). O rastro recomeça em vez de desenhar uma reta falsa.
 */
const JUMP_RESET_M = 1.0;
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
 * - Ao vivo: amostra a pose da CENA (que já vem da TF ou da odometria,
 *   conforme o perfil) e guarda os últimos minutos.
 * - Replay: reconstrói o caminho do início da faixa até o cursor,
 *   amostrando a odometria da fonte (`messageAt`) em intervalos regulares.
 */
export function useTrail(robotPose: RefObject<Pose2D | null>, poseTopic: string): TrailPoint[] {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  const [points, setPoints] = useState<TrailPoint[]>([]);

  // AO VIVO
  useEffect(() => {
    setPoints([]);
    if (!source || mode !== 'live') return;
    const buffer: { t: number; p: TrailPoint }[] = [];

    const timer = setInterval(() => {
      const now = Date.now();
      const pose = robotPose.current;
      const last = buffer[buffer.length - 1];
      const step = pose && last ? Math.hypot(pose.x - last.p[0], pose.y - last.p[1]) : Infinity;
      if (pose && step > JUMP_RESET_M) buffer.length = 0;
      if (pose && step >= MIN_STEP_M) buffer.push({ t: now, p: [pose.x, pose.y, TRAIL_Z] });
      const cutoff = now - LIVE_WINDOW_MS;
      while (buffer.length > 0 && buffer[0]!.t < cutoff) buffer.shift();
      setPoints(buffer.map((b) => b.p));
    }, REFRESH_MS);

    return () => clearInterval(timer);
  }, [source, mode, robotPose]);

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
