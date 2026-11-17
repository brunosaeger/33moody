import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { RobotProfile } from '@/config/robotProfiles';
import { useTopicRef } from '@/data';
import { quaternionToYaw, type Odometry } from '@/lib/ros';
import { yawOf, type TfTree } from '@/lib/tf';
import { sceneFrame } from './sceneFrame';
import { useTfTree } from './tfTree';

/** Pose do robô no plano (frame da cena = map). */
export interface Pose2D {
  x: number;
  y: number;
  yaw: number;
}

/**
 * Suavização: a pose exibida persegue a pose recebida com esta constante
 * (1/s). Mensagens chegam a 10–20 Hz e a tela roda a 60 fps; sem isso o
 * robô andaria "aos pulinhos". Saltos grandes (seek no replay) não são
 * suavizados: o robô aparece direto no lugar novo.
 */
const SMOOTHING_PER_S = 14;
const SNAP_DISTANCE_M = 1.0;

interface RobotPoseRefs {
  /** Pose suavizada: para desenhar o robô e o que anda junto com ele. */
  smoothed: RefObject<Pose2D | null>;
  /** Pose mais recente, sem suavização: para posicionar medições no mundo. */
  latest: RefObject<Pose2D | null>;
}

const RobotPoseContext = createContext<RobotPoseRefs | null>(null);

/** Diferença angular no intervalo (-π, π]. */
function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** Pose pela árvore de TF: frame da cena → frame do robô. */
function poseFromTf(tree: TfTree, profile: RobotProfile, baseFrame: string): Pose2D | null {
  const tf = tree.lookup(sceneFrame(tree, profile), baseFrame);
  return tf ? { x: tf.t[0], y: tf.t[1], yaw: yawOf(tf) } : null;
}

/**
 * Fornece a pose suavizada do robô para tudo dentro da cena.
 * A pose vem da odometria ou da árvore de TF, conforme o perfil do robô,
 * e é atualizada a cada frame (ao vivo ou replay).
 */
export function RobotPoseProvider({ profile, children }: { profile: RobotProfile; children: ReactNode }) {
  const odom = useTopicRef<Odometry>(profile.topics.odom);
  const tree = useTfTree();
  const pose = useRef<Pose2D | null>(null);
  const latest = useRef<Pose2D | null>(null);
  const refs = useMemo(() => ({ smoothed: pose, latest }), []);

  // Prioridade -1: roda ANTES dos componentes que leem a pose no mesmo frame.
  useFrame((_, dt) => {
    let target: Pose2D | null = null;
    if (profile.pose.kind === 'tf') {
      target = poseFromTf(tree, profile, profile.pose.baseFrame);
    } else {
      const p = odom.current?.message.pose.pose;
      if (p) target = { x: p.position.x, y: p.position.y, yaw: quaternionToYaw(p.orientation) };
    }
    latest.current = target;
    if (!target) {
      pose.current = null;
      return;
    }
    const cur = pose.current;

    if (!cur || Math.hypot(target.x - cur.x, target.y - cur.y) > SNAP_DISTANCE_M) {
      pose.current = target;
      return;
    }
    const k = 1 - Math.exp(-SMOOTHING_PER_S * dt);
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    cur.yaw += angleDelta(cur.yaw, target.yaw) * k;
  }, -1);

  return <RobotPoseContext.Provider value={refs}>{children}</RobotPoseContext.Provider>;
}

function usePoseRefs(): RobotPoseRefs {
  const ctx = useContext(RobotPoseContext);
  if (!ctx) throw new Error('useRobotPose precisa estar dentro de <RobotPoseProvider>');
  return ctx;
}

/** Ref com a pose suavizada atual (null = sem dado). Ler dentro de `useFrame`. */
export function useRobotPose(): RefObject<Pose2D | null> {
  return usePoseRefs().smoothed;
}

/**
 * Ref com a pose mais recente, SEM suavização. Para fixar no mundo algo
 * medido agora (ex.: um scan sem TF); a suavizada fica alguns cm atrás.
 */
export function useLatestRobotPose(): RefObject<Pose2D | null> {
  return usePoseRefs().latest;
}

/**
 * Grupo que acompanha o robô (frame base_link): tudo dentro dele é desenhado
 * em coordenadas do robô e anda junto. Some quando não há pose.
 */
export function FollowRobot({ children }: { children: ReactNode }) {
  const pose = useRobotPose();
  const group = useRef<Group>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = pose.current;
    g.visible = p !== null;
    if (p) {
      g.position.set(p.x, p.y, 0);
      g.rotation.set(0, 0, p.yaw);
    }
  });

  return <group ref={group}>{children}</group>;
}
