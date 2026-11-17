import { useEffect, useState, type RefObject } from 'react';
import { supportsReplay, type DataSource, type MessageEvent } from '@moody/data-sources';
import type { RobotProfile } from '@/config/robotProfiles';
import { useClock, useSession, type TimeRange } from '@/data';
import type { Odometry, TFMessage } from '@/lib/ros';
import { sceneFrame, type Pose2D } from '@/lib/scene3d';
import { TF_TOPICS, trajectoryFromTf, type TrajectoryPoint } from '@/lib/tf';

export type TrailPoint = [x: number, y: number, z: number];

/** Ao vivo: quanto do passado o rastro guarda. */
const LIVE_WINDOW_MS = 3 * 60 * 1000;
/** Ao vivo: só registra um ponto novo se o robô andou pelo menos isto (m). */
const MIN_STEP_M = 0.02;
/**
 * Um salto maior que isto entre amostras não é movimento, é troca de
 * referência (ex.: o `map` apareceu, ou a localização corrigiu a pose).
 * O rastro recomeça em vez de desenhar uma reta falsa.
 */
const JUMP_RESET_M = 1.0;
/** Ritmo de atualização do desenho (o rastro não precisa de 60 fps). */
const REFRESH_MS = 150;
/** Replay: máximo de amostras na faixa inteira. */
const MAX_REPLAY_SAMPLES = 800;
const MIN_REPLAY_STEP_MS = 100;
/** Replay com TF: /tf antes do início da faixa, para a árvore já estar montada. */
const TF_WARMUP_MS = 3000;
/** Levemente acima do chão/mapa. */
const TRAIL_Z = 0.01;

/** Pontos a partir do último salto (mesma regra do ao vivo). */
function afterLastJump(points: TrajectoryPoint[]): TrailPoint[] {
  let start = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    if (Math.hypot(b.x - a.x, b.y - a.y) > JUMP_RESET_M) start = i;
  }
  return points.slice(start).map((p) => [p.x, p.y, TRAIL_Z]);
}

/** Quantos pontos têm tempo <= t (busca binária; a trajetória está em ordem). */
function countUpTo(points: TrajectoryPoint[], t: number): number {
  let lo = 0;
  let hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid]!.timeMs <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Trajetória da faixa INTEIRA, calculada uma vez por faixa.
 * - Perfil com TF e fonte com histórico de /tf (gravação): pela árvore de
 *   TF, no frame da cena (`map`), como o robô aparece na tela.
 * - Senão (robô demo): amostrando a odometria com `messageAt`.
 */
function replayTrajectory(source: DataSource, profile: RobotProfile, range: TimeRange): TrajectoryPoint[] {
  const stepMs = Math.max(MIN_REPLAY_STEP_MS, (range.endMs - range.startMs) / MAX_REPLAY_SAMPLES);

  if (profile.pose.kind === 'tf' && source.messagesInRange) {
    const { baseFrame } = profile.pose;
    const statics = source.messagesInRange(TF_TOPICS.static, -Infinity, range.endMs).map((e) => e.message as TFMessage);
    const dynamic = source
      .messagesInRange(TF_TOPICS.dynamic, range.startMs - TF_WARMUP_MS, range.endMs)
      .map((e) => ({ timeMs: e.timeMs, message: e.message as TFMessage }));
    return trajectoryFromTf(statics, dynamic, (tree) => tree.lookup(sceneFrame(tree, profile), baseFrame), stepMs).filter(
      (p) => p.timeMs >= range.startMs,
    );
  }

  if (!supportsReplay(source)) return [];
  const out: TrajectoryPoint[] = [];
  for (let t = range.startMs; t <= range.endMs; t += stepMs) {
    const p = (source.messageAt(profile.topics.odom, t) as MessageEvent<Odometry> | undefined)?.message.pose.pose.position;
    if (p) out.push({ timeMs: t, x: p.x, y: p.y });
  }
  return out;
}

/**
 * Pontos do rastro do robô.
 * - Ao vivo: amostra a pose da CENA (que já vem da TF ou da odometria,
 *   conforme o perfil) e guarda os últimos minutos.
 * - Replay: calcula a trajetória da faixa uma vez e mostra o trecho do
 *   início da faixa até o cursor.
 */
export function useTrail(robotPose: RefObject<Pose2D | null>, profile: RobotProfile): TrailPoint[] {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  const range = useClock((s) => s.range);
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
    if (!source || mode !== 'replay' || !range) return;
    const trajectory = replayTrajectory(source, profile, range);
    let timer: ReturnType<typeof setTimeout> | undefined;

    const show = () => {
      timer = undefined;
      const n = countUpTo(trajectory, useClock.getState().cursorMs);
      setPoints(afterLastJump(trajectory.slice(0, n)));
    };

    show();
    const unsubscribe = useClock.subscribe((s, prev) => {
      if (s.cursorMs !== prev.cursorMs && !timer) timer = setTimeout(show, REFRESH_MS);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [source, mode, range, profile]);

  return points;
}
