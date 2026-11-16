import { useClockDriver, useSession } from '@/data';
import { PlaybackControls } from './PlaybackControls';
import { RangePicker } from './RangePicker';
import { TimelineBar } from './TimelineBar';
import { ClockReadout, LiveButton } from './TimelineStatus';
import styles from './Timeline.module.css';

/**
 * Timeline (rodapé da tela). Só existe com um robô conectado.
 *
 *   [ barra: régua + faixa + cursor                                ]
 *   [ relógio ]       [ « skips  ⏯  skips » · x · velocidade ]   [ ao vivo ]
 *                     [ 📅 data  início → fim  Ver replay ]
 */
export function Timeline() {
  const connected = useSession((s) => s.source !== null);
  if (!connected) return null;
  return <TimelineContent />;
}

/** Separado para o "motor" do play só existir com a timeline visível. */
function TimelineContent() {
  useClockDriver();

  return (
    <section className={styles.timeline} aria-label="Linha do tempo">
      <TimelineBar />
      <div className={styles.controlsRow}>
        <div className={styles.left}>
          <ClockReadout />
        </div>
        <PlaybackControls />
        <div className={styles.right}>
          <LiveButton />
        </div>
      </div>
      <div className={styles.rangeRow}>
        <RangePicker />
      </div>
    </section>
  );
}
