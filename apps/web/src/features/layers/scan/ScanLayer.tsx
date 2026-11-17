import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, type Points } from 'three';
import { colors } from '@moody/theme';
import type { RobotProfile } from '@/config/robotProfiles';
import { useTopicRef } from '@/data';
import type { LaserScan } from '@/lib/ros';
import { sceneFrame, useLatestRobotPose, useTfTree, type Pose2D } from '@/lib/scene3d';
import { compose, stampToSeconds, type TfTree, type Transform } from '@/lib/tf';
import type { LayerProps } from '../types';

/** Capacidade do buffer de pontos (LiDARs 2D comuns têm até alguns milhares). */
const MAX_POINTS = 4096;

/**
 * Onde estava o laser, no frame da cena, NO INSTANTE em que o scan foi medido.
 *
 * Isto evita o "balanço" do scan: o LiDAR manda uma leitura a cada ~200 ms
 * e o robô continua andando/girando nesse meio tempo. Se a leitura fosse
 * desenhada presa ao robô (na pose de agora), ela giraria junto com ele e
 * "voltaria" a cada leitura nova. Fixada no mundo com a pose da medição,
 * ela fica parada no lugar certo, como no RViz.
 *
 * - Com TF: `cena ← frame do scan` no `header.stamp` (histórico da árvore).
 * - Sem TF (robô demo): pose mais recente do robô + `laserOffset` do perfil.
 */
function laserPoseAtScan(
  scan: LaserScan,
  tree: TfTree,
  profile: RobotProfile,
  latestPose: Pose2D | null,
): Transform | undefined {
  if (profile.pose.kind === 'tf' && scan.header.frame_id) {
    const tf = tree.lookup(sceneFrame(tree, profile), scan.header.frame_id, stampToSeconds(scan.header.stamp));
    if (tf) return tf;
  }
  if (!latestPose) return undefined;
  const { x, y, z } = profile.laserOffset;
  const half = latestPose.yaw / 2;
  const robot: Transform = { t: [latestPose.x, latestPose.y, 0], q: [0, 0, Math.sin(half), Math.cos(half)] };
  return compose(robot, { t: [x, y, z], q: [0, 0, 0, 1] });
}

/**
 * LaserScan como nuvem de pontos. Os pontos ficam no frame do laser e o
 * objeto é colocado no mundo na pose da medição; os dois só mudam quando
 * chega uma leitura nova.
 */
export function ScanLayer({ profile }: LayerProps) {
  const message = useTopicRef<LaserScan>(profile.topics.scan);
  const tree = useTfTree();
  const latestPose = useLatestRobotPose();
  const points = useRef<Points>(null);
  const lastScan = useRef<unknown>(null);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);

  useFrame(() => {
    const obj = points.current;
    const scan = message.current?.message;
    if (!obj) return;
    if (!scan) {
      obj.visible = false;
      return;
    }
    if (scan === lastScan.current) return;

    const pose = laserPoseAtScan(scan, tree, profile, latestPose.current);
    // Sem pose ainda: tenta de novo no próximo quadro, com a mesma leitura.
    if (!pose) {
      obj.visible = false;
      return;
    }
    lastScan.current = scan;
    obj.visible = true;
    obj.position.set(pose.t[0], pose.t[1], pose.t[2]);
    obj.quaternion.set(pose.q[0], pose.q[1], pose.q[2], pose.q[3]);

    const attr = geometry.getAttribute('position') as BufferAttribute;
    const out = attr.array as Float32Array;
    let n = 0;
    for (let i = 0; i < scan.ranges.length && n < MAX_POINTS; i++) {
      const r = scan.ranges[i]!;
      // Leituras fora do alcance válido não são obstáculos: descarta.
      if (!(r > scan.range_min && r < scan.range_max)) continue;
      const a = scan.angle_min + i * scan.angle_increment;
      out[n * 3] = r * Math.cos(a);
      out[n * 3 + 1] = r * Math.sin(a);
      out[n * 3 + 2] = 0;
      n++;
    }
    attr.needsUpdate = true;
    geometry.setDrawRange(0, n);
    geometry.computeBoundingSphere();
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial color={colors.stateError} size={0.06} sizeAttenuation />
    </points>
  );
}
