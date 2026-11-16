import { useEffect, useRef, type RefObject } from 'react';
import type { MessageEvent } from '@moody/data-sources';
import { useClock } from './clockStore';
import { useSession } from './sessionStore';
import { followTopic } from './topicStream';

/**
 * Mensagem de um tópico no instante do relógio, guardada numa REF.
 *
 * Para a cena 3D: ela lê a ref dentro do loop de renderização (`useFrame`,
 * 60 fps) sem causar re-render no React a cada mensagem. Ao vivo e no
 * replay funcionam igual.
 */
export function useTopicRef<T = unknown>(topic: string): RefObject<MessageEvent<T> | undefined> {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  const ref = useRef<MessageEvent<T> | undefined>(undefined);

  useEffect(() => {
    ref.current = undefined;
    if (!source) return;
    return followTopic(source, topic, mode, (event) => {
      ref.current = event as MessageEvent<T> | undefined;
    });
  }, [source, topic, mode]);

  return ref;
}
