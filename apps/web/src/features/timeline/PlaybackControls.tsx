import { useState } from 'react';
import { PLAYBACK_SPEEDS, useClock } from '@/data';
import { Icon } from '@/shared/ui/icons';
import styles from './PlaybackControls.module.css';

/** Skips fixos, em segundos. O "x" é o valor personalizado. */
const SKIP_STEPS = [1, 5, 10, 30] as const;
const DEFAULT_CUSTOM_SKIP_S = 60;

interface SkipButtonProps {
  seconds: number;
  direction: -1 | 1;
  label: string;
  disabled: boolean;
}

/** Botão de skip: ícone em cima, quantidade de segundos embaixo. */
function SkipButton({ seconds, direction, label, disabled }: SkipButtonProps) {
  const skip = useClock((s) => s.skip);
  return (
    <button
      type="button"
      className={styles.skip}
      disabled={disabled}
      title={`${direction < 0 ? 'Voltar' : 'Avançar'} ${seconds} s${seconds === 1 ? (direction < 0 ? ' ( ← )' : ' ( → )') : ''}`}
      onClick={() => skip(direction * seconds)}
    >
      <Icon name={direction < 0 ? 'skipBack' : 'skipForward'} size={14} />
      <span className={styles.skipLabel}>{label}</span>
    </button>
  );
}

/**
 * Play/pause, skips (1, 5, 10, 30 e x segundos, para trás e para frente)
 * e velocidade. Só ativos no replay; ao vivo não há o que reproduzir.
 */
export function PlaybackControls() {
  const mode = useClock((s) => s.mode);
  const playing = useClock((s) => s.playing);
  const speed = useClock((s) => s.speed);
  const togglePlay = useClock((s) => s.togglePlay);
  const setSpeed = useClock((s) => s.setSpeed);
  const [customSkip, setCustomSkip] = useState(DEFAULT_CUSTOM_SKIP_S);

  const disabled = mode !== 'replay';
  const backSteps = [...SKIP_STEPS].reverse();

  return (
    <div className={styles.controls} data-disabled={disabled || undefined}>
      <SkipButton seconds={customSkip} direction={-1} label="x" disabled={disabled} />
      {backSteps.map((s) => (
        <SkipButton key={`b${s}`} seconds={s} direction={-1} label={String(s)} disabled={disabled} />
      ))}

      <button
        type="button"
        className={styles.play}
        disabled={disabled}
        aria-label={playing ? 'Pausar' : 'Reproduzir'}
        title={`${playing ? 'Pausar' : 'Reproduzir'} (Espaço)`}
        onClick={togglePlay}
      >
        <Icon name={playing ? 'pause' : 'play'} size={16} />
      </button>

      {SKIP_STEPS.map((s) => (
        <SkipButton key={`f${s}`} seconds={s} direction={1} label={String(s)} disabled={disabled} />
      ))}
      <SkipButton seconds={customSkip} direction={1} label="x" disabled={disabled} />

      <label className={styles.custom} title="Valor do skip personalizado (x), em segundos">
        x =
        <input
          type="number"
          min={1}
          max={3600}
          value={customSkip}
          disabled={disabled}
          onChange={(e) => setCustomSkip(Math.max(1, Math.min(3600, Number(e.target.value) || 1)))}
        />
        s
      </label>

      <select
        className={styles.speed}
        value={speed}
        disabled={disabled}
        title="Velocidade de reprodução ( ↑ ↓ )"
        onChange={(e) => {
          setSpeed(Number(e.target.value));
          e.currentTarget.blur(); // devolve o teclado aos atalhos (Espaço, setas)
        }}
      >
        {PLAYBACK_SPEEDS.map((v) => (
          <option key={v} value={v}>
            {v}×
          </option>
        ))}
      </select>
    </div>
  );
}
