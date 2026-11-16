import styles from './Header.module.css';

/** Logotipo textual: "33" na cor da marca + "moody". */
export function Brand() {
  return (
    <div className={styles.brand} aria-label="33moody">
      <span className={styles.brand33}>33</span>
      <span>moody</span>
    </div>
  );
}
