import { useClock } from '@/data';
import { useNow } from '@/shared/hooks/useNow';
import { formatClock, formatDateBR, formatDuration } from './timeFormat';
import styles from './TimelineStatus.module.css';

/** Horário que a tela está mostrando: o "agora" ao vivo, ou o cursor no replay. */
export function ClockReadout() {
  const mode = useClock((s) => s.mode);
  const cursorMs = useClock((s) => s.cursorMs);
  const range = useClock((s) => s.range);
  const now = useNow(250, mode === 'live');

  const shown = mode === 'replay' ? cursorMs : now;

  return (
    <div className={styles.readout}>
      <span className={styles.time}>{formatClock(shown)}</span>
      <span className={styles.sub}>
        {formatDateBR(shown)}
        {mode === 'replay' && range && (
          <>
            {' · '}
            {formatDuration(cursorMs - range.startMs)} / {formatDuration(range.endMs - range.startMs)}
          </>
        )}
      </span>
    </div>
  );
}

/** Ao vivo: selo "AO VIVO". No replay: botão para voltar ao presente. */
export function LiveButton() {
  const mode = useClock((s) => s.mode);
  const goLive = useClock((s) => s.goLive);

  if (mode === 'live') {
    return (
      <span className={styles.livePill}>
        <span className={styles.dot} /> AO VIVO
      </span>
    );
  }
  return (
    <button type="button" className={styles.liveButton} onClick={goLive} title="Sair do replay e voltar ao presente">
      <span className={styles.dot} /> Voltar ao vivo
    </button>
  );
}
