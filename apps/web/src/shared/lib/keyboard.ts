/**
 * O teclado está "ocupado" com outra coisa: digitando num campo ou numa
 * lista, ou com um modificador de sistema (Ctrl, Alt, Cmd) apertado.
 * Atalhos globais de uma letra devem ignorar o evento nesses casos.
 * (Shift NÃO conta: atalhos podem usar Shift como variação.)
 */
export function isKeyboardBusy(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  const el = e.target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName));
}
