import { useSceneFrame } from '@/lib/scene3d';
import styles from './FrameWarning.module.css';

/**
 * Aviso quando a cena caiu no PLANO B: sem o frame fixo (ex.: `map`, que
 * o AMCL só publica depois de localizar o robô), o robô é desenhado no
 * frame da odometria. A posição dele não bate com o mapa e, quando a
 * localização chega, ele "salta". Acontece ao vivo antes da pose inicial
 * e no início de gravações.
 */
export function FrameWarning() {
  const current = useSceneFrame((s) => s.current);
  const expected = useSceneFrame((s) => s.expected);
  if (!current || !expected || current === expected) return null;
  return (
    <div
      className={styles.chip}
      title={`Ainda não há transformação ${expected} → ${current} neste instante: o robô está sendo desenhado no frame "${current}", e a posição dele não corresponde ao mapa.`}
    >
      <span className={styles.icon} aria-hidden="true">!</span>
      Sem localização no {expected}: exibindo no frame {current}
    </div>
  );
}
