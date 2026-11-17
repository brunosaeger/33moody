import type { DataSource } from '@moody/data-sources';
import type { RobotProfile } from '@/config/robotProfiles';
import { PLAYBACK_SPEEDS, useClock, useSession } from '@/data';
import { useStepperStore } from './stepperStore';

/**
 * Ações de "transporte" do replay (como num player), sem React: usadas
 * pelos botões e pelos atalhos de teclado, para os dois fazerem o MESMO.
 */

/** Tópico do passo: o escolhido, senão o scan do perfil, senão o primeiro. */
export function stepTopic(chosen: string | null, names: readonly string[], profile: RobotProfile): string | undefined {
  if (chosen && names.includes(chosen)) return chosen;
  if (names.includes(profile.topics.scan)) return profile.topics.scan;
  return names[0];
}

/** A fonte sabe andar mensagem por mensagem? */
export function canStepMessages(source: DataSource | null): boolean {
  return typeof source?.neighborMessageTime === 'function';
}

/** Pausa e leva o cursor à mensagem anterior (-1) ou seguinte (1) do tópico do passo. */
export function stepMessage(direction: 1 | -1): void {
  const { source, profile } = useSession.getState();
  const clock = useClock.getState();
  if (clock.mode !== 'replay' || !source?.neighborMessageTime) return;
  const topic = stepTopic(
    useStepperStore.getState().topic,
    source.topics().map((t) => t.name),
    profile,
  );
  if (!topic) return;
  const t = source.neighborMessageTime(topic, clock.cursorMs, direction);
  if (t === undefined) return;
  clock.setPlaying(false);
  clock.seek(t);
}

/** Próxima velocidade da lista (sem sair dos valores predefinidos). */
export function shiftSpeed(direction: 1 | -1): void {
  const clock = useClock.getState();
  const speeds: readonly number[] = PLAYBACK_SPEEDS;
  const i = speeds.indexOf(clock.speed);
  const next = speeds[Math.min(speeds.length - 1, Math.max(0, (i < 0 ? speeds.indexOf(1) : i) + direction))];
  if (next !== undefined) clock.setSpeed(next);
}

/**
 * Segurar a seta: escada de velocidades do avanço contínuo (× tempo real).
 * Cada degrau vale a partir de `afterMs` segurando. Em ordem crescente.
 */
const SCRUB_STAGES = [
  { afterMs: 0, rate: 2 },
  { afterMs: 1500, rate: 4 },
  { afterMs: 4000, rate: 8 },
] as const;

/** Velocidade do degrau em que se está depois de `heldMs` segurando. */
function scrubRate(heldMs: number): number {
  let rate: number = SCRUB_STAGES[0].rate;
  for (const stage of SCRUB_STAGES) if (heldMs >= stage.afterMs) rate = stage.rate;
  return rate;
}

/**
 * Avanço (ou retrocesso) contínuo enquanto a seta está segurada: o cursor
 * anda a 2× o tempo real, depois de 1,5 s a 4× e depois de 4 s a 8×
 * (`SCRUB_STAGES`). A reprodução pausa durante o avanço e volta ao estado
 * anterior ao soltar. Devolve a função que para.
 */
export function startScrub(direction: 1 | -1): () => void {
  const clock = useClock.getState();
  const wasPlaying = clock.playing;
  clock.setPlaying(false);

  const started = performance.now();
  let last = started;
  /** Anda o cursor pelo tempo real decorrido desde a última vez (independe do fps). */
  const advanceTo = (now: number) => {
    const rate = scrubRate(now - started);
    const { cursorMs, seek } = useClock.getState();
    seek(cursorMs + direction * rate * (now - last));
    last = now;
  };
  let frame = requestAnimationFrame(function tick(now) {
    advanceTo(now);
    frame = requestAnimationFrame(tick);
  });

  return () => {
    cancelAnimationFrame(frame);
    // O trecho entre o último quadro e o instante de soltar também conta.
    advanceTo(performance.now());
    useClock.getState().setPlaying(wasPlaying);
  };
}
