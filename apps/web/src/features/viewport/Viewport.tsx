import { useSession } from '@/data';
import { ConnectCard, ConnectionBadge } from '@/features/connection';
import { EmptyState } from '@/shared/ui/EmptyState';
import styles from './Viewport.module.css';

/**
 * Área central: o "RViz" do 33moody.
 * - Sem robô: cartão de conexão.
 * - Com robô: a cena 3D (fase 1; por ora, um aviso) e o selo da conexão.
 */
export function Viewport() {
  const connected = useSession((s) => s.source !== null);

  return (
    <div className={styles.viewport}>
      {connected ? (
        <>
          <div className={styles.overlayTopLeft}>
            <ConnectionBadge />
          </div>
          <EmptyState title="Viewport 3D" hint="A cena do robô aparece aqui (fase 1)." />
        </>
      ) : (
        <div className={styles.center}>
          <ConnectCard />
        </div>
      )}
    </div>
  );
}
