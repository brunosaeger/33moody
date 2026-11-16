import { useRobotProfile } from '@/config/robotProfiles';
import { useSession } from '@/data';
import { EmptyState } from '@/shared/ui/EmptyState';
import { isLayerEnabled, useLayersStore } from './layersStore';
import { LAYERS } from './registry';
import styles from './LayersPanel.module.css';

/** Aba Camadas: liga/desliga cada camada do viewport 3D. */
export function LayersPanel() {
  const connected = useSession((s) => s.source !== null);
  const enabled = useLayersStore((s) => s.enabled);
  const setEnabled = useLayersStore((s) => s.setEnabled);
  const profile = useRobotProfile();

  if (!connected) {
    return <EmptyState title="Nenhuma camada" hint="Conecte um robô para ver as camadas disponíveis." />;
  }

  return (
    <ul className={styles.list}>
      {LAYERS.map((layer) => {
        const on = isLayerEnabled(enabled, layer.id, layer.defaultEnabled);
        return (
          <li key={layer.id}>
            <label className={styles.row} data-on={on || undefined}>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={on}
                onChange={(e) => setEnabled(layer.id, e.target.checked)}
              />
              <span className={styles.text}>
                <span className={styles.title}>{layer.title}</span>
                <span className={styles.description}>{layer.description}</span>
                <span className={styles.topics}>{layer.topics(profile).join(' · ')}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
