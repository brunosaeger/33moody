import { formatClock, formatHourMinute } from '@/shared/lib/timeFormat';

/**
 * Régua da timeline: janela visível, conversão tempo <-> posição e traços.
 * Só cálculo, sem React.
 */

export interface TimeWindow {
  startMs: number;
  endMs: number;
}

export interface Tick {
  timeMs: number;
  /** Posição horizontal, de 0 a 1, dentro da janela. */
  pos: number;
  major: boolean;
  label?: string;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/** Ao vivo, a régua mostra os últimos minutos até "agora". */
const LIVE_SPAN_MS = 10 * MINUTE;
const LIVE_LOOKAHEAD_MS = 20 * SECOND;
/** No replay, uma folga dos dois lados para os marcadores não colarem na borda. */
const REPLAY_PADDING = 0.05;
/** Distância mínima desejada entre traços principais (px). */
const MIN_MAJOR_SPACING_PX = 90;

/** Passos possíveis entre traços principais e em quantas partes cada um se divide. */
const STEPS: readonly (readonly [stepMs: number, minorDivisions: number])[] = [
  [1 * SECOND, 5],
  [2 * SECOND, 2],
  [5 * SECOND, 5],
  [10 * SECOND, 5],
  [15 * SECOND, 3],
  [30 * SECOND, 3],
  [1 * MINUTE, 4],
  [2 * MINUTE, 2],
  [5 * MINUTE, 5],
  [10 * MINUTE, 5],
  [15 * MINUTE, 3],
  [30 * MINUTE, 3],
  [1 * HOUR, 4],
  [2 * HOUR, 2],
  [3 * HOUR, 3],
  [6 * HOUR, 6],
  [12 * HOUR, 4],
];

export function liveWindow(nowMs: number): TimeWindow {
  return { startMs: nowMs - LIVE_SPAN_MS, endMs: nowMs + LIVE_LOOKAHEAD_MS };
}

export function replayWindow(range: TimeWindow): TimeWindow {
  const pad = (range.endMs - range.startMs) * REPLAY_PADDING;
  return { startMs: range.startMs - pad, endMs: range.endMs + pad };
}

/** Instante -> posição relativa (0 a 1) na janela. */
export function timeToPos(ms: number, w: TimeWindow): number {
  return (ms - w.startMs) / (w.endMs - w.startMs);
}

/** Posição relativa (0 a 1) -> instante. */
export function posToTime(pos: number, w: TimeWindow): number {
  return w.startMs + pos * (w.endMs - w.startMs);
}

/** Deslocamento do fuso local, para alinhar os traços em horas "redondas" locais. */
function localOffsetMs(ms: number): number {
  return -new Date(ms).getTimezoneOffset() * MINUTE;
}

/** Traços da régua para uma janela com `widthPx` de largura. */
export function computeTicks(w: TimeWindow, widthPx: number): Tick[] {
  const span = w.endMs - w.startMs;
  if (span <= 0 || widthPx <= 0) return [];

  const msPerPx = span / widthPx;
  const [step, divisions] =
    STEPS.find(([s]) => s / msPerPx >= MIN_MAJOR_SPACING_PX) ?? STEPS[STEPS.length - 1]!;
  const minor = step / divisions;
  const labelOf = step < MINUTE ? formatClock : formatHourMinute;

  // Primeiro traço menor alinhado ao relógio local (ex.: 14:50:00, não 14:49:37).
  const offset = localOffsetMs(w.startMs);
  const first = Math.ceil((w.startMs + offset) / minor) * minor - offset;

  const ticks: Tick[] = [];
  for (let t = first; t <= w.endMs; t += minor) {
    const major = Math.round((t + offset) % step) === 0;
    ticks.push({ timeMs: t, pos: timeToPos(t, w), major, label: major ? labelOf(t) : undefined });
  }
  return ticks;
}
