import { colors } from '@moody/theme';
import type { RobotProfile } from '@/config/robotProfiles';

const WHEEL_RADIUS = 0.08;
const WHEEL_WIDTH = 0.05;
const LIDAR_RADIUS = 0.06;
const LIDAR_HEIGHT = 0.06;
/** Cinza-azulado claro o bastante para destacar sobre o chão escuro do mapa. */
const BODY_COLOR = '#5b6779';

/**
 * Modelo PROVISÓRIO de AMR feito de primitivas (no frame base_link: x para
 * frente, z para cima, origem no chão, no centro do robô).
 * Será trocado pelo URDF do robô alvo; por isso recebe só as dimensões.
 */
export function GenericAmrModel({ body }: { body: RobotProfile['body'] }) {
  const { length, width, height } = body;
  const bodyZ = WHEEL_RADIUS + height / 2 - 0.03; // corpo um pouco "afundado" entre as rodas
  const topZ = bodyZ + height / 2;

  return (
    <group>
      {/* Corpo */}
      <mesh position={[0, 0, bodyZ]} castShadow>
        <boxGeometry args={[length, width, height]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.55} metalness={0.15} />
      </mesh>

      {/* Para-choque frontal (marca a frente) */}
      <mesh position={[length / 2 + 0.01, 0, bodyZ - height * 0.15]}>
        <boxGeometry args={[0.02, width * 0.9, height * 0.35]} />
        <meshStandardMaterial color={colors.accentAmber} emissive={colors.accentAmber} emissiveIntensity={0.25} />
      </mesh>

      {/* Seta no topo apontando para a frente */}
      <mesh position={[length * 0.12, 0, topZ + 0.002]} rotation={[0, 0, -Math.PI / 2]}>
        <circleGeometry args={[width * 0.22, 3]} />
        <meshBasicMaterial color={colors.accentAmber} />
      </mesh>

      {/* Rodas (esquerda e direita) */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, side * (width / 2 + WHEEL_WIDTH / 2), WHEEL_RADIUS]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 24]} />
          <meshStandardMaterial color="#0b0d10" roughness={0.9} />
        </mesh>
      ))}

      {/* LiDAR no topo */}
      <mesh position={[0, 0, topZ + LIDAR_HEIGHT / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[LIDAR_RADIUS, LIDAR_RADIUS, LIDAR_HEIGHT, 24]} />
        <meshStandardMaterial color={colors.accentCyan} emissive={colors.accentCyan} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
