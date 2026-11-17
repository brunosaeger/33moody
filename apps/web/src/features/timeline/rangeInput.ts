import type { TimeRange } from '@/data';

/**
 * Onde existe dado: numa gravação, o arquivo; ao vivo, todo o passado
 * até agora (o historian do robô vai definir o início real).
 */
export interface DataBounds {
  startMs: number;
  endMs: number;
  /** true = gravação (arquivo); false = robô ao vivo/demo. */
  recorded: boolean;
}
import { parseLocalDateTime } from '@/shared/lib/timeFormat';

/** Faixa máxima de replay (o pacote de replay baixa tudo de uma vez). */
const MAX_RANGE_MS = 24 * 60 * 60 * 1000;

export type RangeValidation = { ok: true; range: TimeRange } | { ok: false; error: string };

/**
 * Valida o que o técnico digitou: data + hora inicial + hora final.
 * Só lógica, sem React.
 */
export function validateRange(date: string, start: string, end: string, bounds: DataBounds): RangeValidation {
  const startMs = parseLocalDateTime(date, start);
  const endMs = parseLocalDateTime(date, end);
  if (startMs === null || endMs === null) return { ok: false, error: 'Preencha a data e os dois horários.' };
  if (endMs <= startMs) return { ok: false, error: 'O fim precisa ser depois do início.' };
  if (startMs > bounds.endMs) {
    return { ok: false, error: bounds.recorded ? 'A faixa começa depois do fim da gravação.' : 'A faixa está no futuro.' };
  }
  if (endMs < bounds.startMs) return { ok: false, error: 'A faixa termina antes do início da gravação.' };
  if (endMs - startMs > MAX_RANGE_MS) return { ok: false, error: 'Faixa máxima: 24 horas.' };
  // Partes fora de onde há dado são cortadas (ex.: fim no futuro → agora).
  return { ok: true, range: { startMs: Math.max(startMs, bounds.startMs), endMs: Math.min(endMs, bounds.endMs) } };
}
