import { useRef, useState, type FormEvent } from 'react';
import { DemoSource, FoxgloveSource, McapSource } from '@moody/data-sources';
import { DEMO_PROFILE, LIVE_ROBOT_PROFILES } from '@/config/robotProfiles';
import { useSession } from '@/data';
import { Button } from '@/shared/ui/Button';
import { loadConnectionPrefs, saveConnectionPrefs } from './connectionPrefs';
import styles from './ConnectCard.module.css';

/**
 * Cartão mostrado no viewport quando não há robô conectado. Três caminhos:
 * - robô AO VIVO: endereço do foxglove_bridge;
 * - GRAVAÇÃO: um arquivo .mcap (ros2 bag record -s mcap), aberto em replay;
 * - robô DEMO, para explorar a interface.
 * O perfil do robô vale para os dois primeiros.
 */
export function ConnectCard() {
  const connect = useSession((s) => s.connect);
  const status = useSession((s) => s.status);
  const error = useSession((s) => s.error);
  const [prefs, setPrefs] = useState(loadConnectionPrefs);
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = status === 'connecting';

  const selectedProfile = () =>
    LIVE_ROBOT_PROFILES.find((p) => p.id === prefs.profileId) ?? LIVE_ROBOT_PROFILES[0]!;

  const connectLive = (e: FormEvent) => {
    e.preventDefault();
    const url = prefs.url.trim();
    saveConnectionPrefs({ ...prefs, url });
    void connect(new FoxgloveSource(url), selectedProfile());
  };

  const openRecording = (file: File | undefined) => {
    if (!file) return;
    saveConnectionPrefs(prefs);
    void connect(new McapSource(file), selectedProfile());
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>Nenhum robô conectado</div>
      <p className={styles.text}>
        Conecte no <code>foxglove_bridge</code> do robô para acompanhar ao vivo, ou abra uma gravação{' '}
        <code>.mcap</code> para o replay.
      </p>

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

      <form className={styles.form} onSubmit={connectLive}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Endereço (ao vivo)</span>
          <input
            className={styles.input}
            value={prefs.url}
            onChange={(e) => setPrefs({ ...prefs, url: e.target.value })}
            placeholder="ws://host:8765"
            spellCheck={false}
            disabled={busy}
          />
        </label>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={busy || prefs.url.trim() === ''}>
            {status === 'connecting' ? 'Abrindo…' : 'Conectar'}
          </Button>
          <Button disabled={busy} onClick={() => fileInput.current?.click()}>
            Abrir gravação (.mcap)
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".mcap"
            hidden
            onChange={(e) => {
              openRecording(e.target.files?.[0]);
              e.target.value = ''; // permite abrir o mesmo arquivo de novo
            }}
          />
        </div>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.divider}>ou</div>
      <Button disabled={busy} onClick={() => void connect(new DemoSource(), DEMO_PROFILE)}>
        Usar robô demo
      </Button>
    </div>
  );
}
