import { useMemo, useRef, type PointerEvent } from 'react';
import { useClock } from '@/data';
import { useElementWidth } from '@/shared/hooks/useElementWidth';
import { useNow } from '@/shared/hooks/useNow';
import { MarkerFlags } from './markers';
import { computeTicks, liveWindow, posToTime, replayWindow, timeToPos } from './ruler';
import { formatClockMs } from '@/shared/lib/timeFormat';
import styles from './TimelineBar.module.css';

const pct = (pos: number) => `${(pos * 100).toFixed(3)}%`;

/**
 * A barra da timeline (retângulo arredondado com a régua).
 * - Ao vivo: últimos minutos, com o marcador "AGORA" na ponta direita.
 * - Replay: a faixa escolhida entre dois marcadores vermelhos, e o cursor
 *   em seta, que se arrasta (ou se posiciona clicando na barra).
 */
export function TimelineBar() {
  const mode = useClock((s) => s.mode);
  const range = useClock((s) => s.range);
  const cursorMs = useClock((s) => s.cursorMs);
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const now = useNow(1000, mode === 'live');
  const dragging = useRef(false);

  const isReplay = mode === 'replay' && range !== null;
  const view = useMemo(() => (isReplay ? replayWindow(range) : liveWindow(now)), [isReplay, range, now]);
  const ticks = useMemo(() => computeTicks(view, width), [view, width]);

  /** Posição do ponteiro -> instante, e move o cursor até lá. */
  const seekToPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    useClock.getState().seek(posToTime(pos, view));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!isReplay) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    useClock.getState().setPlaying(false); // arrastar pausa a reprodução
    seekToPointer(e);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) seekToPointer(e);
  };

  const endDrag = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={ref}
      className={styles.bar}
      data-mode={mode}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Régua */}
      {ticks.map((t) => (
        <div key={t.timeMs} className={styles.tick} data-major={t.major || undefined} style={{ left: pct(t.pos) }}>
          {t.label && <span className={styles.tickLabel}>{t.label}</span>}
        </div>
      ))}

      {isReplay ? (
        <>
          {/* Faixa escolhida + marcadores vermelhos de início e fim */}
          <div
            className={styles.rangeFill}
            style={{
              left: pct(timeToPos(range.startMs, view)),
              width: pct(timeToPos(range.endMs, view) - timeToPos(range.startMs, view)),
            }}
          />
          <div className={styles.rangeMarker} style={{ left: pct(timeToPos(range.startMs, view)) }} title="Início da faixa" />
          <div className={styles.rangeMarker} style={{ left: pct(timeToPos(range.endMs, view)) }} title="Fim da faixa" />

          {/* Pontos de interesse (Q…M), abaixo do cursor */}
          <MarkerFlags view={view} />

          {/* Cursor em seta (rótulo vira para a esquerda perto da borda direita) */}
          <div
            className={styles.cursor}
            data-flip={timeToPos(cursorMs, view) > 0.85 || undefined}
            style={{ left: pct(timeToPos(cursorMs, view)) }}
          >
            <span className={styles.cursorLabel}>{formatClockMs(cursorMs)}</span>
            <svg className={styles.cursorArrow} viewBox="0 0 16 12" aria-hidden="true">
              <path d="M1 1h14L8 11z" />
            </svg>
            <div className={styles.cursorLine} />
          </div>
        </>
      ) : (
        <>
          <MarkerFlags view={view} />
          <div className={styles.now} style={{ left: pct(timeToPos(now, view)) }}>
            <span className={styles.nowLabel}>AGORA</span>
            <div className={styles.nowLine} />
          </div>
        </>
      )}
    </div>
  );
}
