import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { RobotProfile } from '@/config/robotProfiles';
import { FollowRobot, sceneFrame, useTfTree } from '@/lib/scene3d';
import type { TfTree } from '@/lib/tf';
import type { LayerProps } from '../types';
import styles from './TfLayer.module.css';

interface FrameProps {
  name: string;
  size: number;
  /** Altura do rótulo em relação à origem do frame (m). */
  labelZ?: number;
  /** Sem rótulo: só os eixos (frames secundários, para não poluir a cena). */
  hideLabel?: boolean;
}

/** Eixos de um frame (vermelho = x, verde = y, azul = z, como no RViz) com o nome. */
function Frame({ name, size, labelZ = size * 0.9, hideLabel = false }: FrameProps) {
  return (
    <group>
      <axesHelper args={[size]} />
      {!hideLabel && (
        <Html position={[0, 0, labelZ]} center className={styles.label} zIndexRange={[10, 0]}>
          {name}
        </Html>
      )}
    </group>
  );
}

/** Tamanho dos eixos dos frames da árvore (o frame da cena fica maior). */
const TREE_FRAME_SIZE = 0.12;

interface TreeFrameProps {
  tree: TfTree;
  profile: RobotProfile;
  name: string;
  labeled: boolean;
}

/** Um frame da árvore real, reposicionado a cada quadro. */
function TreeFrame({ tree, profile, name, labeled }: TreeFrameProps) {
  const group = useRef<Group>(null);
  const isScene = name === sceneFrame(tree, profile);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const tf = tree.lookup(sceneFrame(tree, profile), name);
    g.visible = tf !== undefined;
    if (tf) {
      g.position.set(tf.t[0], tf.t[1], tf.t[2]);
      g.quaternion.set(tf.q[0], tf.q[1], tf.q[2], tf.q[3]);
    }
  });

  return (
    <group ref={group}>
      <Frame
        name={name}
        size={isScene ? 1 : TREE_FRAME_SIZE}
        // O frame do robô fica colado no base_link: rótulo embaixo, no chão.
        labelZ={profile.pose.kind === 'tf' && name === profile.pose.baseFrame ? -0.08 : undefined}
        hideLabel={!labeled}
      />
    </group>
  );
}

/**
 * Frames com nome visível: a "espinha" do robô (frame do robô e seus
 * ancestrais: base_footprint → odom → map) e os filhos diretos dela que
 * importam no diagnóstico (base_link, laser). O resto fica só com os eixos:
 * um robô real tem dezenas de frames e os nomes viram uma pilha ilegível.
 */
function labeledFrames(tree: TfTree, profile: RobotProfile): Set<string> {
  if (profile.pose.kind !== 'tf') return new Set();
  const spine = tree.chain(profile.pose.baseFrame);
  const labeled = new Set(spine);
  for (const f of tree.frames()) {
    const chain = tree.chain(f);
    // Até 2 níveis abaixo do frame do robô (ex.: base_link, base_scan).
    const i = chain.indexOf(profile.pose.baseFrame);
    if (i > 0 && i <= 2 && /(^|_)(base|scan|laser|lidar)/.test(f)) labeled.add(f);
  }
  return labeled;
}

/**
 * Frames de coordenadas.
 * - Com /tf (robô real): TODOS os frames da árvore, como o display TF do RViz.
 * - Sem /tf (robô demo): map, base_link e laser derivados da pose e do perfil.
 */
export function TfLayer({ profile }: LayerProps) {
  const tree = useTfTree();
  const [frames, setFrames] = useState<string[]>([]);
  const seenVersion = useRef(-1);

  // A lista só muda quando aparece um frame novo (raro); a posição muda todo quadro.
  useFrame(() => {
    if (tree.version === seenVersion.current) return;
    seenVersion.current = tree.version;
    setFrames(tree.frames().sort());
  });

  if (frames.length > 0) {
    const labeled = labeledFrames(tree, profile);
    return (
      <>
        {frames.map((name) => (
          <TreeFrame key={name} tree={tree} profile={profile} name={name} labeled={labeled.has(name)} />
        ))}
      </>
    );
  }

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
