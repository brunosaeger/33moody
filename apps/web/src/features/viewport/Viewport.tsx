import { useSession } from '@/data';
import { ConnectCard, ConnectionBadge } from '@/features/connection';
import { CameraToolbar } from './camera/CameraToolbar';
import { FrameWarning } from './FrameWarning';
import { ModeChip } from './ModeChip';
import { Scene } from './scene/Scene';
import styles from './Viewport.module.css';

/**
 * Área central: o "RViz" do 33moody.
 * - Sem robô: cartão de conexão.
 * - Com robô: a cena 3D + controles sobrepostos (conexão, modo, câmera).
 */
export function Viewport() {
  const connected = useSession((s) => s.source !== null);

  if (!connected) {
    return (
      <div className={styles.viewport} data-empty>
        <div className={styles.center}>
          <ConnectCard />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.viewport}>
      <Scene />
      <div className={styles.overlayTopLeft}>
        <ConnectionBadge />
        <ModeChip />
        <FrameWarning />
      </div>
      <div className={styles.overlayTopRight}>
        <CameraToolbar />
      </div>
    </div>
  );
}
