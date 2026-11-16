import { useEffect, useState } from 'react';
import type { MessageEvent } from '@moody/data-sources';
import { useClock, type ClockMode } from './clockStore';
import { useSession } from './sessionStore';
import { RateMeter } from './RateMeter';
import { followTopic } from './topicStream';

/**
 * Ritmo de atualização da UI. Mensagens podem chegar a 50 Hz ou mais, mas
 * re-renderizar a ~10 Hz já é fluido para leitura humana e poupa CPU.
 * (No replay, um pouco mais ágil para acompanhar o arraste do cursor.)
 */
const REFRESH_MS: Record<ClockMode, number> = { live: 100, replay: 50 };

export interface TopicMessageState {
  /** Mensagem do instante atual (undefined se ainda não houver). */
  latest: MessageEvent | undefined;
  /** Frequência medida de chegada (Hz). Só faz sentido ao vivo. */
  hz: number;
  mode: ClockMode;
}

/**
 * Mensagem de um tópico NO INSTANTE ATUAL do relógio, para a UI (React state):
 * ao vivo, a última que chegou; no replay, a reconstruída para o cursor.
 */
export function useTopicMessage(topic: string): TopicMessageState {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  const [state, setState] = useState<TopicMessageState>({ latest: undefined, hz: 0, mode });

  useEffect(() => {
    setState({ latest: undefined, hz: 0, mode });
    if (!source) return;

    const meter = new RateMeter();
    let latest: MessageEvent | undefined;
    let dirty = false;
    let shownHz = 0;

    const stop = followTopic(source, topic, mode, (event) => {
      latest = event;
      dirty = true;
      if (mode === 'live') meter.tick(performance.now());
    });

    // Leva ao React em ritmo fixo, não a cada mensagem. Também atualiza
    // quando só a frequência mudou (ex.: tópico parou → 0 Hz).
    const timer = setInterval(() => {
      const hz = mode === 'live' ? meter.hz(performance.now()) : 0;
      if (!dirty && hz === shownHz) return;
      dirty = false;
      shownHz = hz;
      setState({ latest, hz, mode });
    }, REFRESH_MS[mode]);

    return () => {
      stop();
      clearInterval(timer);
    };
  }, [source, topic, mode]);

  return state;
}
