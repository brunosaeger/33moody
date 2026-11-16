import type { ReactNode } from 'react';
import { Brand } from './Brand';
import styles from './Header.module.css';

export interface HeaderProps {
  /** Conteúdo logo após a marca (ex.: toggles das janelas). */
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
}

/**
 * Barra superior da aplicação. Genérica: só posiciona a marca e três slots.
 * QUEM preenche os slots é o `App` (composição), não a header.
 */
export function Header({ start, center, end }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Brand />
      <div className={styles.start}>{start}</div>
      <div className={styles.center}>{center}</div>
      <div className={styles.end}>{end}</div>
    </header>
  );
}
