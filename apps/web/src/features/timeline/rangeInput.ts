import type { TimeRange } from '@/data';
import { parseLocalDateTime } from '@/shared/lib/timeFormat';

/** Faixa máxima de replay (o pacote de replay baixa tudo de uma vez). */
const MAX_RANGE_MS = 24 * 60 * 60 * 1000;

export type RangeValidation = { ok: true; range: TimeRange } | { ok: false; error: string };

/**
 * Valida o que o técnico digitou: data + hora inicial + hora final.
 * Só lógica, sem React.
 */
export function validateRange(date: string, start: string, end: string, nowMs: number): RangeValidation {
  const startMs = parseLocalDateTime(date, start);
  const endMs = parseLocalDateTime(date, end);
  if (startMs === null || endMs === null) return { ok: false, error: 'Preencha a data e os dois horários.' };
  if (endMs <= startMs) return { ok: false, error: 'O fim precisa ser depois do início.' };
  if (startMs > nowMs) return { ok: false, error: 'A faixa está no futuro.' };
  if (endMs - startMs > MAX_RANGE_MS) return { ok: false, error: 'Faixa máxima: 24 horas.' };
  // Fim no futuro: corta no "agora" (não há dado depois disso).
  return { ok: true, range: { startMs, endMs: Math.min(endMs, nowMs) } };
}
