import { supportsReplay, type DataSource, type MessageEvent } from '@moody/data-sources';
import { useClock, type ClockMode } from './clockStore';

/**
 * Acompanhar um tópico NO INSTANTE DO RELÓGIO, sem React:
 * - ao vivo: assina a fonte e repassa cada mensagem que chega;
 * - replay: pergunta à fonte (`messageAt`) a mensagem do instante do cursor
 *   sempre que ele anda (sem repetir a mesma mensagem).
 *
 * É a base dos hooks `useTopicMessage` (UI, 10 Hz) e `useTopicRef` (3D, 60 fps).
 * Devolve a função que para de acompanhar.
 */
export function followTopic(
  source: DataSource,
  topic: string,
  mode: ClockMode,
  onMessage: (event: MessageEvent | undefined) => void,
): () => void {
  if (mode === 'live') return source.subscribe(topic, onMessage);
  if (!supportsReplay(source)) return () => {};

  let shownStamp: number | undefined;
  const update = () => {
    const event = source.messageAt(topic, useClock.getState().cursorMs);
    if (event !== undefined && event.timeMs === shownStamp) return;
    shownStamp = event?.timeMs;
    onMessage(event);
  };

  update();
  return useClock.subscribe((s, prev) => {
    if (s.cursorMs !== prev.cursorMs || s.range !== prev.range) update();
  });
}
