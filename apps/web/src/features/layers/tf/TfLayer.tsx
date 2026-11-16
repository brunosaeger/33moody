import { Html } from '@react-three/drei';
import { FollowRobot } from '@/lib/scene3d';
import type { LayerProps } from '../types';
import styles from './TfLayer.module.css';

interface FrameProps {
  name: string;
  size: number;
  /** Altura do rótulo em relação à origem do frame (m). */
  labelZ?: number;
}

/** Eixos de um frame (vermelho = x, verde = y, azul = z, como no RViz) com o nome. */
function Frame({ name, size, labelZ = size * 0.9 }: FrameProps) {
  return (
    <group>
      <axesHelper args={[size]} />
      <Html position={[0, 0, labelZ]} center className={styles.label} zIndexRange={[10, 0]}>
        {name}
      </Html>
    </group>
  );
}

/**
 * Frames de coordenadas: map (origem da cena), base_link (robô) e laser.
 * Por enquanto derivados da pose; com /tf real, virá da árvore de TF.
 */
export function TfLayer({ profile }: LayerProps) {
  const { x, y, z } = profile.laserOffset;
  return (
    <>
      <Frame name="map" size={1} />
      <FollowRobot>
        {/* Rótulo no chão: o do laser fica logo acima, no topo do robô. */}
        <Frame name="base_link" size={0.45} labelZ={-0.08} />
        <group position={[x, y, z]}>
          <Frame name="laser" size={0.25} />
        </group>
      </FollowRobot>
    </>
  );
}
