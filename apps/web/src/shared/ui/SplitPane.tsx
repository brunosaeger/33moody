import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import styles from './SplitPane.module.css';

export interface SplitPaneProps {
  /** Área principal (à esquerda): ocupa todo o espaço restante. */
  main: ReactNode;
  /** Painel lateral (à direita), de largura ajustável. */
  side: ReactNode;
  sideWidth: number;
  /** Chamado ao FIM do arraste (ou por teclado), com a nova largura já limitada. */
  onSideWidthChange: (width: number) => void;
  minSide: number;
  maxSide: number;
  /** A área principal nunca fica mais estreita que isto. */
  minMain: number;
  /** Largura restaurada com duplo clique no divisor. */
  defaultSide: number;
}

const KEYBOARD_STEP_PX = 16;

/**
 * Divide a tela em área principal + painel lateral direito, com um divisor
 * arrastável entre eles. Genérico: não sabe o que está dentro de cada lado.
 *
 * Durante o arraste a largura vive em estado local, e o valor final só é
 * entregue (`onSideWidthChange`) ao soltar, para não gravar no storage a
 * cada pixel.
 */
export function SplitPane({
  main,
  side,
  sideWidth,
  onSideWidthChange,
  minSide,
  maxSide,
  minMain,
  defaultSide,
}: SplitPaneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  /** Limita a largura ao intervalo permitido, considerando o tamanho da tela agora. */
  const clamp = (width: number) => {
    const total = rootRef.current?.clientWidth ?? Infinity;
    const max = Math.min(maxSide, total - minMain);
    return Math.round(Math.max(minSide, Math.min(max, width)));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startWidth: sideWidth };
    setDragWidth(sideWidth);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    // Painel à direita: arrastar para a ESQUERDA aumenta a largura.
    setDragWidth(clamp(drag.current.startWidth + (drag.current.startX - e.clientX)));
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    if (dragWidth !== null) onSideWidthChange(dragWidth);
    setDragWidth(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') onSideWidthChange(clamp(sideWidth + KEYBOARD_STEP_PX));
    if (e.key === 'ArrowRight') onSideWidthChange(clamp(sideWidth - KEYBOARD_STEP_PX));
  };

  const width = dragWidth ?? sideWidth;

  return (
    <div ref={rootRef} className={styles.root} data-dragging={dragWidth !== null || undefined}>
      <div className={styles.main}>{main}</div>
      <div
        className={styles.handle}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={width}
        aria-valuemin={minSide}
        aria-valuemax={maxSide}
        aria-label="Redimensionar menu lateral"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => onSideWidthChange(clamp(defaultSide))}
        onKeyDown={onKeyDown}
      />
      <aside className={styles.side} style={{ width }}>
        {side}
      </aside>
    </div>
  );
}
