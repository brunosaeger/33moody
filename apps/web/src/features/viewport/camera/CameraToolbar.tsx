import { useCameraStore, type CameraPreset } from './cameraStore';
import styles from './CameraToolbar.module.css';

const OPTIONS: readonly { preset: CameraPreset; label: string; hint: string }[] = [
  { preset: 'orbit', label: 'Orbital', hint: 'Vista 3/4 com movimento livre (clique de novo para recentralizar)' },
  { preset: 'follow', label: 'Seguir robô', hint: 'A câmera acompanha o robô por trás' },
  { preset: 'top', label: 'Topo', hint: 'Vista de cima, como um mapa 2D' },
];

/** Botões de preset de câmera, sobrepostos ao canto do viewport. */
export function CameraToolbar() {
  const preset = useCameraStore((s) => s.preset);
  const setPreset = useCameraStore((s) => s.setPreset);

  return (
    <div className={styles.toolbar} role="group" aria-label="Câmera">
      {OPTIONS.map((o) => (
        <button
          key={o.preset}
          type="button"
          className={styles.option}
          aria-pressed={preset === o.preset}
          title={o.hint}
          onClick={() => setPreset(o.preset)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
