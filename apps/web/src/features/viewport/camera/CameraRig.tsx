import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useRobotPose } from '@/lib/scene3d';
import { useCameraStore, type CameraPreset } from './cameraStore';

/** Posições iniciais (frame map, metros, z para cima). */
const PRESETS: Record<Exclude<CameraPreset, 'follow'>, { position: [number, number, number]; target: [number, number, number] }> = {
  orbit: { position: [-6.5, -8.5, 7.5], target: [0, 0, 0] },
  // y levemente negativo: olhar exatamente de cima trava a rotação do OrbitControls.
  top: { position: [0, -0.01, 15], target: [0, 0, 0] },
};

/** Câmera "seguir robô": atrás e acima, olhando um pouco à frente dele. */
const FOLLOW = { back: 3.2, up: 2.2, lookAhead: 0.8, lookHeight: 0.3, smoothingPerS: 4 };

const desiredPos = new Vector3();
const desiredTarget = new Vector3();

/**
 * Controla a câmera: aplica o preset escolhido e, no modo "seguir",
 * persegue o robô a cada frame. Nos outros modos, o usuário orbita,
 * move e dá zoom livremente (OrbitControls).
 */
export function CameraRig() {
  const preset = useCameraStore((s) => s.preset);
  const revision = useCameraStore((s) => s.revision);
  const camera = useThree((s) => s.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const pose = useRobotPose();

  // Aplica o preset ao escolher (ou re-escolher) um.
  useEffect(() => {
    if (preset === 'follow') return;
    const { position, target } = PRESETS[preset];
    camera.position.set(...position);
    controls.current?.target.set(...target);
    controls.current?.update();
  }, [preset, revision, camera]);

  useFrame((_, dt) => {
    if (preset !== 'follow') return;
    const p = pose.current;
    const c = controls.current;
    if (!p || !c) return;
    const cos = Math.cos(p.yaw);
    const sin = Math.sin(p.yaw);
    desiredPos.set(p.x - cos * FOLLOW.back, p.y - sin * FOLLOW.back, FOLLOW.up);
    desiredTarget.set(p.x + cos * FOLLOW.lookAhead, p.y + sin * FOLLOW.lookAhead, FOLLOW.lookHeight);
    const k = 1 - Math.exp(-FOLLOW.smoothingPerS * dt);
    camera.position.lerp(desiredPos, k);
    c.target.lerp(desiredTarget, k);
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={preset !== 'follow'}
      enableDamping
      dampingFactor={0.12}
      maxPolarAngle={Math.PI / 2 - 0.05} // não deixa a câmera ir para baixo do chão
      minDistance={0.5}
      maxDistance={80}
    />
  );
}
