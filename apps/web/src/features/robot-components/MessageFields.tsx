import { useMemo } from 'react';
import { flattenMessage } from '@/lib/ros';
import styles from './MessageFields.module.css';

/** Árvore de campos e valores de uma mensagem ROS. */
export function MessageFields({ message }: { message: unknown }) {
  const rows = useMemo(() => flattenMessage(message), [message]);

  return (
    <div className={styles.fields}>
      {rows.map((row) => (
        <div key={row.path} className={styles.row} data-kind={row.kind} style={{ paddingLeft: row.depth * 12 }}>
          <span className={styles.name}>{row.name}</span>
          {row.kind !== 'group' && <span className={styles.value}>{row.value}</span>}
        </div>
      ))}
    </div>
  );
}
