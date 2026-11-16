import { Grid } from '@react-three/drei';
import { colors } from '@moody/theme';

/**
 * Grade de chão infinita no plano XY (z = 0).
 * O Grid do drei vive no plano XZ (y para cima); como a cena usa a
 * convenção do ROS (z para cima), giramos 90° em torno de X.
 * Células de 0,5 m e seções de 2,5 m.
 */
export function Ground() {
  return (
    <Grid
      rotation={[Math.PI / 2, 0, 0]}
      infiniteGrid
      cellSize={0.5}
      sectionSize={2.5}
      cellThickness={0.6}
      sectionThickness={1}
      cellColor={colors.panelLine}
      sectionColor="#3a4554"
      fadeDistance={45}
      fadeStrength={1.5}
    />
  );
}
