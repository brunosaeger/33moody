import { useEffect, useState } from 'react';
import { supportsReplay, type DataSource, type MessageEvent } from '@moody/data-sources';
import { useClock, type ClockMode } from './clockStore';
import { useSession } from './sessionStore';
import { RateMeter } from './RateMeter';

/**
 * Taxa de atualização da UI ao vivo. Mensagens podem chegar a 50 Hz ou mais,
 * mas re-renderizar a 10 Hz já é fluido para leitura humana e poupa CPU.
 */
const LIVE_REFRESH_MS = 100;
/** No replay, a resposta ao arrastar o cursor precisa ser mais ágil. */
const REPLAY_REFRESH_MS = 50;

export interface TopicMessageState {
  /** Mensagem do instante atual (undefined se ainda não houver). */
  latest: MessageEvent | undefined;
  /** Frequência medida de chegada (Hz). Só faz sentido ao vivo. */
  hz: number;
  mode: ClockMode;
}

type Setter = (s: TopicMessageState) => void;

/** AO VIVO: assina o tópico e mede a frequência; leva ao React em ritmo fixo. */
function followLive(source: DataSource, topic: string, set: Setter): () => void {
  const meter = new RateMeter();
  let latest: MessageEvent | undefined;
  let dirty = false;
  let shownHz = 0;

  const unsubscribe = source.subscribe(topic, (event) => {
    latest = event;
    dirty = true;
    meter.tick(performance.now());
  });

  // Também atualiza quando só a frequência mudou (ex.: tópico parou → 0 Hz).
  const timer = setInterval(() => {
    const hz = meter.hz(performance.now());
    if (!dirty && hz === shownHz) return;
    dirty = false;
    shownHz = hz;
    set({ latest, hz, mode: 'live' });
  }, LIVE_REFRESH_MS);

  return () => {
    unsubscribe();
    clearInterval(timer);
  };
}

/** REPLAY: pergunta à fonte a mensagem do instante do cursor sempre que ele anda. */
function followReplay(
  source: DataSource & Required<Pick<DataSource, 'messageAt'>>,
  topic: string,
  set: Setter,
): () => void {
  let shownStamp: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const update = () => {
    timer = undefined;
    const event = source.messageAt(topic, useClock.getState().cursorMs);
    // Mesmo carimbo de tempo = mesma mensagem: não re-renderiza.
    if (event?.timeMs === shownStamp && event !== undefined) return;
    shownStamp = event?.timeMs;
    set({ latest: event, hz: 0, mode: 'replay' });
  };

  update();
  const unsubscribe = useClock.subscribe((s, prev) => {
    if (s.cursorMs !== prev.cursorMs && !timer) timer = setTimeout(update, REPLAY_REFRESH_MS);
  });

  return () => {
    unsubscribe();
    clearTimeout(timer);
  };
}

/**
 * Mensagem de um tópico NO INSTANTE ATUAL do relógio:
 * ao vivo, a última que chegou; no replay, a reconstruída para o cursor.
 */
export function useTopicMessage(topic: string): TopicMessageState {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  const [state, setState] = useState<TopicMessageState>({ latest: undefined, hz: 0, mode });

  useEffect(() => {
    setState({ latest: undefined, hz: 0, mode });
    if (!source) return;
    if (mode === 'replay') {
      return supportsReplay(source) ? followReplay(source, topic, setState) : undefined;
    }
    return followLive(source, topic, setState);
  }, [source, topic, mode]);

  return state;
}
