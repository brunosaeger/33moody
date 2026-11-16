/**
 * Formatação e leitura de horários, sempre no fuso LOCAL do navegador
 * (o técnico pensa em "14:50 de terça", não em UTC).
 */

const pad = (n: number, size = 2) => String(n).padStart(size, '0');

/** 14:05:09 */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 14:05 */
export function formatHourMinute(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 10/11/2026 */
export function formatDateBR(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Valor para <input type="date">: 2026-11-10 */
export function toDateInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Valor para <input type="time" step="1">: 14:05:09 */
export function toTimeInput(ms: number): string {
  return formatClock(ms);
}

/** Data ("2026-11-10") + hora ("14:05" ou "14:05:09") locais -> epoch ms, ou null se inválido. */
export function parseLocalDateTime(date: string, time: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return null;
  const ms = new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Duração legível: 1:05:09 ou 05:09 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
