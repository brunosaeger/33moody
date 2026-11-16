import { Line } from '@react-three/drei';
import { colors } from '@moody/theme';
import type { LayerProps } from '../types';
import { useTrail } from './useTrail';

/** Rastro "fantasma" do caminho que o robô realmente percorreu. */
export function TrailLayer({ profile }: LayerProps) {
  const points = useTrail(profile.topics.pose);
  if (points.length < 2) return null;
  return <Line points={points} color={colors.accentAmber} lineWidth={2} transparent opacity={0.75} />;
}
