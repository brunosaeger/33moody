import { useSession } from '@/data';
import { Button } from '@/shared/ui/Button';
import styles from './ConnectionBadge.module.css';

/** Selo discreto com a fonte conectada e o botão de desconectar. */
export function ConnectionBadge() {
  const source = useSession((s) => s.source);
  const disconnect = useSession((s) => s.disconnect);
  if (!source) return null;

  return (
    <div className={styles.badge}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{source.label}</span>
      <Button variant="ghost" size="sm" onClick={disconnect}>
        Desconectar
      </Button>
    </div>
  );
}
