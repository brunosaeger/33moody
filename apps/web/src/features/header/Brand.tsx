import styles from './Header.module.css';

/** Título da aplicação: "33" na cor da marca + "Robotics" | nome da plataforma. */
export function Brand() {
  return (
    <div className={styles.brand} aria-label="33 Robotics | Plataforma de Diagnóstico">
      <span className={styles.brand33}>33</span>
      <span>&nbsp;Robotics</span>
      <span className={styles.brandSeparator} aria-hidden="true">|</span>
      <span className={styles.brandProduct}>Plataforma de Diagnóstico</span>
    </div>
  );
}
