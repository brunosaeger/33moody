import { isRecording } from '@moody/data-sources';
import { useClock, useSession } from '@/data';
import { useNow } from '@/shared/hooks/useNow';
import { formatClock, formatClockMs, formatDateBR, formatDuration } from '@/shared/lib/timeFormat';
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
      {/* No replay, com milissegundos: meio segundo muda o que está na tela. */}
      <span className={styles.time}>{mode === 'replay' ? formatClockMs(shown) : formatClock(shown)}</span>
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
  // Gravação (arquivo) não tem presente para onde voltar.
  const recording = useSession((s) => s.source !== null && isRecording(s.source));

  if (recording) {
    return (
      <span className={styles.recordingPill} title="Reproduzindo um arquivo gravado">
        GRAVAÇÃO
      </span>
    );
  }

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
