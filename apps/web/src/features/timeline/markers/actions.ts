import { isRecording, supportsReplay } from '@moody/data-sources';
import { useClock, useSession } from '@/data';
import { useMarkersStore } from './markersStore';

/** Ao vivo, ir a um ponto abre o replay com este tanto de contexto antes dele. */
const LIVE_CONTEXT_MS = 60 * 1000;

/** Instante que a tela está mostrando: o cursor no replay, o agora ao vivo. */
function currentInstant(): number {
  const clock = useClock.getState();
  return clock.mode === 'replay' ? clock.cursorMs : Date.now();
}

/** Marca o ponto da letra no instante atual (se já existir, move). */
export function markHere(letter: string): void {
  const source = useSession.getState().source;
  if (source) useMarkersStore.getState().setMarker(source.id, letter, currentInstant());
}

/**
 * Leva o cursor ao ponto da letra, PAUSADO.
 * - Replay com o ponto dentro da faixa: só move o cursor.
 * - Gravação com o ponto fora da faixa: volta à gravação inteira.
 * - Ao vivo, se a fonte tem histórico (ex.: demo): abre o replay do
 *   ponto até agora. Sem histórico (robô ao vivo sem gravação): não há
 *   para onde ir.
 */
export function goToMarker(timeMs: number): void {
  const source = useSession.getState().source;
  const clock = useClock.getState();
  if (!source || !supportsReplay(source)) return;

  const inRange = clock.mode === 'replay' && clock.range && timeMs >= clock.range.startMs && timeMs <= clock.range.endMs;
  if (!inRange) {
    if (isRecording(source)) clock.startReplay(source.recordedRange());
    else clock.startReplay({ startMs: timeMs - LIVE_CONTEXT_MS, endMs: Date.now() });
  }
  const after = useClock.getState();
  after.setPlaying(false);
  after.seek(timeMs);
}

/** Letra apertada: o primeiro toque marca; os seguintes levam ao ponto. */
export function onMarkerKey(letter: string, redefine: boolean): void {
  const source = useSession.getState().source;
  if (!source) return;
  const existing = useMarkersStore.getState().bySource[source.id]?.[letter];
  if (existing === undefined || redefine) markHere(letter);
  else goToMarker(existing);
}
