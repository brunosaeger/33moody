import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  hint?: ReactNode;
  icon?: ReactNode;
}

/** Mensagem centralizada para janelas sem conteúdo ainda. */
export function EmptyState({ title, hint, icon }: EmptyStateProps) {
  return (
    <div className={styles.root}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.title}>{title}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
