import { isRecording } from '@moody/data-sources';
import { useSession } from '@/data';
import type { DataBounds } from './rangeInput';

/**
 * Limites de tempo com dado na fonte atual. Os da gravação são fixos; os
 * do ao vivo terminam "agora", então são calculados na hora de usar.
 */
export function useDataBounds(): () => DataBounds {
  const source = useSession((s) => s.source);
  return () => {
    if (source && isRecording(source)) return { ...source.recordedRange(), recorded: true };
    return { startMs: -Infinity, endMs: Date.now(), recorded: false };
  };
}
