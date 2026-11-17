import { DEFAULT_FOXGLOVE_URL } from '@moody/data-sources';
import { LIVE_ROBOT_PROFILES } from '@/config/robotProfiles';
import { readJSON, writeJSON } from '@/shared/lib/storage';

/** Último robô ao qual o usuário se conectou (para não redigitar). */
export interface ConnectionPrefs {
  url: string;
  profileId: string;
}

const KEY = 'moody.connection.v1';

export function loadConnectionPrefs(): ConnectionPrefs {
  const saved = readJSON<Partial<ConnectionPrefs>>(KEY);
  const profileId = LIVE_ROBOT_PROFILES.some((p) => p.id === saved?.profileId)
    ? saved!.profileId!
    : LIVE_ROBOT_PROFILES[0]!.id;
  return { url: typeof saved?.url === 'string' && saved.url ? saved.url : DEFAULT_FOXGLOVE_URL, profileId };
}

export function saveConnectionPrefs(prefs: ConnectionPrefs): void {
  writeJSON(KEY, prefs);
}
