import { useClock } from '@/data';
import { formatClockMs } from '@/shared/lib/timeFormat';
import styles from './ModeChip.module.css';

/** Selo no viewport indicando que a cena é um REPLAY (e de qual instante). */
export function ModeChip() {
  const mode = useClock((s) => s.mode);
  const cursorMs = useClock((s) => s.cursorMs);
  if (mode !== 'replay') return null;
  return (
    <div className={styles.chip}>
      REPLAY <span className={styles.time}>{formatClockMs(cursorMs)}</span>
    </div>
  );
}
