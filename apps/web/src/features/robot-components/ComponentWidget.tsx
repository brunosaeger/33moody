import { useSession, useTopicMessage } from '@/data';
import { shortSchemaName } from '@/lib/ros';
import { Icon } from '@/shared/ui/icons';
import type { BoardWidget } from './board';
import { MessageFields } from './MessageFields';
import styles from './ComponentWidget.module.css';

/**
 * Classes GLOBAIS (não CSS Module) usadas como seletores pela grade:
 * arrastar só pelo cabeçalho e nunca pelos botões.
 */
export const DRAG_HANDLE_CLASS = 'moody-widget-handle';
export const NO_DRAG_CLASS = 'moody-widget-nodrag';

interface ComponentWidgetProps {
  widget: BoardWidget;
  onRemove: () => void;
}

/** Um componente no quadro: cabeçalho com o tópico e a frequência + os valores ao vivo. */
export function ComponentWidget({ widget, onRemove }: ComponentWidgetProps) {
  const connected = useSession((s) => s.source !== null);
  const { latest, hz, mode } = useTopicMessage(widget.topic);

  return (
    <div className={styles.widget}>
      <div className={`${styles.header} ${DRAG_HANDLE_CLASS}`} title={widget.schemaName}>
        <span className={styles.topic}>{widget.topic}</span>
        <span className={styles.schema}>{shortSchemaName(widget.schemaName)}</span>
        {mode === 'replay' ? (
          <span className={styles.replay}>REPLAY</span>
        ) : (
          <span className={styles.hz} data-live={hz > 0 || undefined}>
            {hz > 0 ? `${hz.toFixed(1)} Hz` : '—'}
          </span>
        )}
        <button
          type="button"
          className={`${styles.remove} ${NO_DRAG_CLASS}`}
          aria-label={`Remover ${widget.topic}`}
          title="Remover"
          onClick={onRemove}
        >
          <Icon name="close" size={10} />
        </button>
      </div>
      <div className={styles.body}>
        {!connected ? (
          <div className={styles.status}>Sem robô conectado</div>
        ) : latest ? (
          <MessageFields message={latest.message} />
        ) : (
          <div className={styles.status}>{mode === 'replay' ? 'Sem dados neste instante' : 'Aguardando mensagens…'}</div>
        )}
      </div>
    </div>
  );
}
