import { useCallback, useSyncExternalStore } from 'react';
import type { TopicInfo } from '@moody/data-sources';
import { useSession } from './sessionStore';

const EMPTY: readonly TopicInfo[] = [];

/** Lista de tópicos da fonte ativa, atualizada quando a fonte anuncia mudança. */
export function useTopics(): readonly TopicInfo[] {
  const source = useSession((s) => s.source);

  const subscribe = useCallback(
    (onChange: () => void) => (source ? source.onTopicsChange(onChange) : () => {}),
    [source],
  );
  const getSnapshot = useCallback(() => (source ? source.topics() : EMPTY), [source]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
