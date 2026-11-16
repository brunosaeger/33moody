/**
 * Id curto e único o bastante para itens de UI (componentes, layouts…).
 * Não usa `crypto.randomUUID()` porque ele não existe em contexto inseguro
 * (http://ip-da-vpn), e o 33moody vai ser acessado assim.
 */
export function createId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}
