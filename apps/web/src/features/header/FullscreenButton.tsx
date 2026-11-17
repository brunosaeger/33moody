import { useFullscreen } from '@/shared/hooks/useFullscreen';
import { Icon } from '@/shared/ui/icons';
import styles from './FullscreenButton.module.css';

/** Liga/desliga a tela cheia. Some em navegadores que não permitem. */
export function FullscreenButton() {
  const { isFullscreen, supported, toggle } = useFullscreen();
  if (!supported) return null;
  const label = isFullscreen ? 'Sair da tela cheia (Esc)' : 'Tela cheia';

  return (
    <button
      type="button"
      className={styles.button}
      onClick={(e) => {
        toggle();
        e.currentTarget.blur(); // Espaço volta a ser play/pause, e não "clicar de novo"
      }}
      title={label}
      aria-label={label}
      aria-pressed={isFullscreen}
    >
      <Icon name={isFullscreen ? 'minimize' : 'maximize'} size={15} />
    </button>
  );
}
