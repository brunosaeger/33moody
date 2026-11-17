import { useCallback, useRef, useState } from 'react';
import { useClock, useRobotProfile, useSession, useTopics } from '@/data';
import { shortSchemaName } from '@/lib/ros';
import { Icon } from '@/shared/ui/icons';
import { Menu } from '@/shared/ui/Menu';
import { useStepperStore } from './stepperStore';
import { canStepMessages, stepMessage, stepTopic } from './transport';
import styles from './MessageStepper.module.css';

/**
 * Anda o cursor MENSAGEM POR MENSAGEM de um tópico (como a seta → do
 * `ros2 bag play`, mas nos dois sentidos): `⏮ [tópico] ⏭`, ou `,` e `.`
 * no teclado. Para achar o instante exato em que algo mudou: um comando
 * novo no /cmd_vel, um scan novo.
 *
 * Só aparece no replay e se a fonte sabe responder a mensagem vizinha.
 */
export function MessageStepper() {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  const topics = useTopics();
  const profile = useRobotProfile();
  const chosen = useStepperStore((s) => s.topic);
  const setTopic = useStepperStore((s) => s.setTopic);
  const pickerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  if (mode !== 'replay' || !canStepMessages(source) || topics.length === 0) return null;
  const topic = stepTopic(
    chosen,
    topics.map((t) => t.name),
    profile,
  );

  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.button}
        onClick={() => stepMessage(-1)}
        aria-label="Mensagem anterior"
        title="Mensagem anterior do tópico ( , )"
      >
        <Icon name="stepBack" size={14} />
      </button>
      <button
        ref={pickerRef}
        type="button"
        className={styles.topic}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Tópico do passo"
        aria-expanded={menuOpen}
        title="Tópico usado para andar mensagem por mensagem"
      >
        {topic}
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={() => stepMessage(1)}
        aria-label="Próxima mensagem"
        title="Próxima mensagem do tópico ( . )"
      >
        <Icon name="stepForward" size={14} />
      </button>

      {menuOpen && pickerRef.current && (
        <Menu
          anchor={pickerRef.current}
          onClose={closeMenu}
          title="Andar mensagem por mensagem em"
          searchable
          searchPlaceholder="Buscar tópico ou tipo…"
          items={topics.map((t) => ({
            id: t.name,
            label: t.name,
            hint: shortSchemaName(t.schemaName),
            onSelect: () => setTopic(t.name),
          }))}
        />
      )}
    </div>
  );
}
