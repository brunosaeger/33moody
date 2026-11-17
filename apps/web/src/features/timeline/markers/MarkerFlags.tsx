import type { CSSProperties, PointerEvent } from 'react';
import { useSession } from '@/data';
import { formatClockMs } from '@/shared/lib/timeFormat';
import { timeToPos, type TimeWindow } from '../ruler';
import { goToMarker } from './actions';
import { MARKER_KEYS, markerColor } from './keys';
import { useMarkersStore, useSourceMarkers } from './markersStore';
import styles from './MarkerFlags.module.css';

/**
 * Pontos de interesse desenhados na barra da timeline: uma faixa vertical
 * de cor viva com uma bolinha no topo e a letra (branca) dentro.
 * Clique na bolinha: vai ao ponto. Clique direito: apaga.
 */
export function MarkerFlags({ view }: { view: TimeWindow }) {
  const sourceId = useSession((s) => s.source?.id);
  const markers = useSourceMarkers(sourceId);
  const removeMarker = useMarkersStore((s) => s.removeMarker);

  // Ordem do teclado: os mais quentes (fim da lista) ficam por cima ao se sobrepor.
  const visible = MARKER_KEYS.filter((letter) => {
    const t = markers[letter];
    return t !== undefined && t >= view.startMs && t <= view.endMs;
  });

  // A barra inteira posiciona o cursor ao ser clicada: a bolinha não deixa.
  const stop = (e: PointerEvent) => e.stopPropagation();

  return (
    <>
      {visible.map((letter) => {
        const timeMs = markers[letter]!;
        return (
          <div
            key={letter}
            className={styles.flag}
            style={{ left: `${(timeToPos(timeMs, view) * 100).toFixed(3)}%`, '--marker-color': markerColor(letter) } as CSSProperties}
          >
            <button
              type="button"
              className={styles.bubble}
              title={`${letter} · ${formatClockMs(timeMs)}\nClique (ou ${letter}): ir · Shift+${letter}: redefinir · clique direito: apagar`}
              aria-label={`Ponto de interesse ${letter}, ${formatClockMs(timeMs)}`}
              onPointerDown={stop}
              onClick={(e) => {
                goToMarker(timeMs);
                e.currentTarget.blur(); // devolve o teclado aos atalhos
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (sourceId) removeMarker(sourceId, letter);
              }}
            >
              {letter}
            </button>
            <div className={styles.stripe} />
          </div>
        );
      })}
    </>
  );
}
