import { Canvas } from '@react-three/fiber';
import { colors } from '@moody/theme';
import { useRobotProfile } from '@/data';
import { EnabledLayers } from '@/features/layers';
import { RobotPoseProvider, TfTreeProvider } from '@/lib/scene3d';
import { CameraRig } from '../camera/CameraRig';
import { Ground } from './Ground';

/**
 * A cena 3D. Convenção do ROS: metros, frame map, z para cima.
 * Nada aqui sabe se os dados são ao vivo ou replay: as camadas leem do
 * relógio da sessão.
 */
export function Scene() {
  const profile = useRobotProfile();

  return (
    <Canvas
      camera={{ position: [-6.5, -8.5, 7.5], up: [0, 0, 1], fov: 50, near: 0.05, far: 500 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[colors.panelBase]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, -6, 10]} intensity={1.4} />
      <hemisphereLight args={['#c9d6ff', colors.panelBase, 0.35]} />

      <TfTreeProvider>
        <RobotPoseProvider profile={profile}>
          <Ground />
          <EnabledLayers />
          <CameraRig />
        </RobotPoseProvider>
      </TfTreeProvider>
    </Canvas>
  );
}
