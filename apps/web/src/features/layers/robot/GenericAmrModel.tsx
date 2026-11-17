import { colors } from '@moody/theme';
import type { RobotProfile } from '@/config/robotProfiles';

/** Cinza-azulado claro o bastante para destacar sobre o chão escuro do mapa. */
const BODY_COLOR = '#5b6779';

/**
 * Modelo PROVISÓRIO de AMR feito de primitivas (no frame base_link: x para
 * frente, z para cima, origem no chão, no centro do robô).
 * Será trocado pelo URDF do robô alvo; por isso recebe só as dimensões.
 */
export function GenericAmrModel({ body }: { body: RobotProfile['body'] }) {
  const { length, width, height, wheelRadius } = body;
  // Rodas e LiDAR proporcionais ao robô (um TurtleBot é ~1/2 do demo).
  const wheelWidth = Math.max(0.018, width * 0.11);
  const lidarRadius = Math.min(0.06, width * 0.16);
  const lidarHeight = lidarRadius;
  const bodyZ = wheelRadius + height / 2 - wheelRadius * 0.4; // corpo um pouco "afundado" entre as rodas
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
        <mesh key={side} position={[0, side * (width / 2 + wheelWidth / 2), wheelRadius]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 24]} />
          <meshStandardMaterial color="#0b0d10" roughness={0.9} />
        </mesh>
      ))}

      {/* LiDAR no topo */}
      <mesh position={[0, 0, topZ + lidarHeight / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[lidarRadius, lidarRadius, lidarHeight, 24]} />
        <meshStandardMaterial color={colors.accentCyan} emissive={colors.accentCyan} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
