import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry } from 'three';
import { colors } from '@moody/theme';
import { useTopicRef } from '@/data';
import type { LaserScan } from '@/lib/ros';
import { FollowRobot } from '@/lib/scene3d';
import type { LayerProps } from '../types';

/** Capacidade do buffer de pontos (LiDARs 2D comuns têm até alguns milhares). */
const MAX_POINTS = 4096;

/**
 * LaserScan como nuvem de pontos, no frame do laser (que segue o robô).
 * Os pontos são recalculados só quando chega uma mensagem nova.
 */
export function ScanLayer({ profile }: LayerProps) {
  const message = useTopicRef<LaserScan>(profile.topics.scan);
  const lastScan = useRef<unknown>(null);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);

  useFrame(() => {
    const scan = message.current?.message;
    if (!scan || scan === lastScan.current) return;
    lastScan.current = scan;

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

  const { x, y, z } = profile.laserOffset;
  return (
    <FollowRobot>
      <points geometry={geometry} position={[x, y, z]} frustumCulled={false}>
        <pointsMaterial color={colors.stateError} size={0.06} sizeAttenuation />
      </points>
    </FollowRobot>
  );
}
