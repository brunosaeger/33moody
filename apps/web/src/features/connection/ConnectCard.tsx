import { useState, type FormEvent } from 'react';
import { DemoSource, FoxgloveSource } from '@moody/data-sources';
import { DEMO_PROFILE, LIVE_ROBOT_PROFILES } from '@/config/robotProfiles';
import { useSession } from '@/data';
import { Button } from '@/shared/ui/Button';
import { loadConnectionPrefs, saveConnectionPrefs } from './connectionPrefs';
import styles from './ConnectCard.module.css';

/**
 * Cartão mostrado no viewport quando não há robô conectado:
 * conectar num robô real (foxglove_bridge) ou usar o robô demo.
 */
export function ConnectCard() {
  const connect = useSession((s) => s.connect);
  const status = useSession((s) => s.status);
  const error = useSession((s) => s.error);
  const [prefs, setPrefs] = useState(loadConnectionPrefs);
  const busy = status === 'connecting';

  const connectLive = (e: FormEvent) => {
    e.preventDefault();
    const profile = LIVE_ROBOT_PROFILES.find((p) => p.id === prefs.profileId) ?? LIVE_ROBOT_PROFILES[0]!;
    const url = prefs.url.trim();
    saveConnectionPrefs({ ...prefs, url });
    void connect(new FoxgloveSource(url), profile);
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>Nenhum robô conectado</div>
      <p className={styles.text}>
        Conecte no <code>foxglove_bridge</code> do robô para ver a cena e os componentes ao vivo.
      </p>

      <form className={styles.form} onSubmit={connectLive}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Endereço</span>
          <input
            className={styles.input}
            value={prefs.url}
            onChange={(e) => setPrefs({ ...prefs, url: e.target.value })}
            placeholder="ws://host:8765"
            spellCheck={false}
            disabled={busy}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Robô</span>
          <select
            className={styles.input}
            value={prefs.profileId}
            onChange={(e) => setPrefs({ ...prefs, profileId: e.target.value })}
            disabled={busy}
          >
            {LIVE_ROBOT_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="primary" disabled={busy || prefs.url.trim() === ''}>
          {busy ? 'Conectando…' : 'Conectar'}
        </Button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.divider}>ou</div>
      <Button disabled={busy} onClick={() => void connect(new DemoSource(), DEMO_PROFILE)}>
        Usar robô demo
      </Button>
    </div>
  );
}
