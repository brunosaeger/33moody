import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ArrowHelper, Color, Vector3 } from 'three';
import { colors } from '@moody/theme';
import { useTopicRef } from '@/data';
import type { Odometry, Twist } from '@/lib/ros';
import { FollowRobot } from '@/lib/scene3d';
import type { LayerProps } from '../types';

/** Escala visual: 1 m/s vira uma seta de 1,5 m. */
const METERS_PER_MPS = 1.5;
/** Abaixo disso a seta some (robô parado). */
const MIN_SPEED = 0.01;
const ARROW_Z = { commanded: 0.5, measured: 0.46 };

/** Vetor reaproveitado a cada frame (evita criar lixo para o GC a 60 fps). */
const direction = new Vector3();

/** Atualiza uma seta a partir de uma velocidade linear no frame do robô. */
function updateArrow(arrow: ArrowHelper, linear: { x: number; y: number } | undefined): void {
  const speed = linear ? Math.hypot(linear.x, linear.y) : 0;
  arrow.visible = speed > MIN_SPEED;
  if (!linear || !arrow.visible) return;
  arrow.setDirection(direction.set(linear.x, linear.y, 0).normalize());
  const length = speed * METERS_PER_MPS;
  arrow.setLength(length, Math.min(0.15, length * 0.4), 0.08);
}

/**
 * Velocidade COMANDADA (cmd_vel, âmbar) × MEDIDA (odometria, ciano).
 * Se as setas divergem, o robô não está fazendo o que foi mandado.
 */
export function VelocityLayer({ profile }: LayerProps) {
  const cmd = useTopicRef<Twist>(profile.topics.cmdVel);
  const odom = useTopicRef<Odometry>(profile.topics.pose);

  const arrows = useMemo(
    () => ({
      commanded: new ArrowHelper(new Vector3(1, 0, 0), new Vector3(0, 0, ARROW_Z.commanded), 1, new Color(colors.accentAmber)),
      measured: new ArrowHelper(new Vector3(1, 0, 0), new Vector3(0, 0, ARROW_Z.measured), 1, new Color(colors.accentCyan)),
    }),
    [],
  );

  useFrame(() => {
    updateArrow(arrows.commanded, cmd.current?.message.linear);
    updateArrow(arrows.measured, odom.current?.message.twist.twist.linear);
  });

  return (
    <FollowRobot>
      <primitive object={arrows.commanded} />
      <primitive object={arrows.measured} />
    </FollowRobot>
  );
}
