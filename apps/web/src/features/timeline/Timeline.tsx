import { supportsReplay } from '@moody/data-sources';
import { useClockDriver, useSession } from '@/data';
import { useMarkerHotkeys } from './markers';
import { MessageStepper } from './MessageStepper';
import { PlaybackControls } from './PlaybackControls';
import { RangePicker } from './RangePicker';
import { TimelineBar } from './TimelineBar';
import { useTransportHotkeys } from './useTransportHotkeys';
import { ClockReadout, LiveButton } from './TimelineStatus';
import styles from './Timeline.module.css';

/**
 * Timeline (rodapé da tela). Só existe com um robô conectado.
 *
 *   [ barra: régua + faixa + cursor                                ]
 *   [ relógio ◂tópico▸ ] [ « skips  ⏯  skips » · x · velocidade ]   [ ao vivo ]
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
  useTransportHotkeys();
  useMarkerHotkeys();
  // Fonte sem histórico (robô ao vivo, sem gravação): só o presente.
  const canReplay = useSession((s) => s.source !== null && supportsReplay(s.source));

  return (
    <section className={styles.timeline} aria-label="Linha do tempo">
      <TimelineBar />
      <div className={styles.controlsRow}>
        <div className={styles.left}>
          <ClockReadout />
          <MessageStepper />
        </div>
        {canReplay ? <PlaybackControls /> : <span />}
        <div className={styles.right}>
          <LiveButton />
        </div>
      </div>
      <div className={styles.rangeRow}>
        {canReplay ? (
          <RangePicker />
        ) : (
          <span className={styles.noReplay}>
            Replay indisponível: esta conexão é só ao vivo. Ele chega com a gravação (MCAP e historian).
          </span>
        )}
      </div>
    </section>
  );
}
