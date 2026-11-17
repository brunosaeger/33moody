import { useState } from 'react';
import { useClock, useRobotProfile, useSession, useTopics } from '@/data';
import { Icon } from '@/shared/ui/icons';
import styles from './MessageStepper.module.css';

/**
 * Anda o cursor MENSAGEM POR MENSAGEM de um tópico (como a seta → do
 * `ros2 bag play`, mas nos dois sentidos). Para achar o instante exato em
 * que algo mudou: um comando novo no /cmd_vel, um scan novo.
 *
 * Só aparece no replay e se a fonte sabe responder a mensagem vizinha.
 */
export function MessageStepper() {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  const topics = useTopics();
  const profile = useRobotProfile();
  const [chosen, setChosen] = useState<string | null>(null);

  if (mode !== 'replay' || !source?.neighborMessageTime || topics.length === 0) return null;

  // Padrão: o scan do perfil (mensagens frequentes e visíveis na cena).
  const names = topics.map((t) => t.name);
  const topic = chosen && names.includes(chosen) ? chosen : names.includes(profile.topics.scan) ? profile.topics.scan : names[0]!;

  const step = (direction: 1 | -1) => {
    const clock = useClock.getState();
    const t = source.neighborMessageTime?.(topic, clock.cursorMs, direction);
    if (t === undefined) return;
    clock.setPlaying(false);
    clock.seek(t);
  };

  return (
    <div className={styles.stepper} title="Andar mensagem por mensagem do tópico escolhido">
      <button type="button" className={styles.button} onClick={() => step(-1)} aria-label="Mensagem anterior">
        <Icon name="stepBack" size={14} />
      </button>
      <select className={styles.topic} value={topic} onChange={(e) => setChosen(e.target.value)} aria-label="Tópico do passo">
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button type="button" className={styles.button} onClick={() => step(1)} aria-label="Próxima mensagem">
        <Icon name="stepForward" size={14} />
      </button>
    </div>
  );
}
