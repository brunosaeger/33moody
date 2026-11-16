/**
 * Acesso seguro ao localStorage, com JSON.
 * O storage pode estar bloqueado (modo privado, política do navegador),
 * então nada aqui lança exceção: na falha, o dado vale só para a sessão.
 */

export function readJSON<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sem storage: ignora */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}
