import { DemoSource } from '@moody/data-sources';
import { useSession } from '@/data';
import { Button } from '@/shared/ui/Button';
import styles from './ConnectCard.module.css';

/**
 * Cartão mostrado no viewport quando não há robô conectado.
 * v1: só o robô demo. O formulário de conexão real (endereço VPN,
 * foxglove_bridge, perfil do robô) entra quando os dados estiverem definidos.
 */
export function ConnectCard() {
  const connect = useSession((s) => s.connect);
  const status = useSession((s) => s.status);
  const error = useSession((s) => s.error);

  return (
    <div className={styles.card}>
      <div className={styles.title}>Nenhum robô conectado</div>
      <p className={styles.text}>
        Conecte um robô para ver a cena e os componentes ao vivo, ou use o robô demo para explorar a
        interface.
      </p>
      <Button
        variant="primary"
        disabled={status === 'connecting'}
        onClick={() => void connect(new DemoSource())}
      >
        {status === 'connecting' ? 'Conectando…' : 'Usar robô demo'}
      </Button>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
