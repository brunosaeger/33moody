import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Menu.module.css';

export interface MenuItem {
  id: string;
  label: string;
  /** Texto secundário à direita (ex.: tipo da mensagem). */
  hint?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface MenuProps {
  /** Elemento que abriu o menu; o menu aparece logo abaixo dele. */
  anchor: HTMLElement;
  items: readonly MenuItem[];
  onClose: () => void;
  /** Cabeçalho opcional do menu. */
  title?: string;
  /** Mensagem exibida quando não há itens. */
  emptyText?: string;
  /** Alinha a borda esquerda (padrão) ou direita do menu à âncora. */
  align?: 'left' | 'right';
}

/**
 * Menu suspenso genérico.
 * Renderizado num portal no <body>, então não é cortado por containers com
 * `overflow: hidden` (como o menu lateral e os componentes).
 * Fecha ao clicar fora, ao apertar Esc ou ao escolher um item.
 */
export function Menu({ anchor, items, onClose, title, emptyText, align = 'left' }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });

  useLayoutEffect(() => {
    const rect = anchor.getBoundingClientRect();
    setPos(
      align === 'left'
        ? { top: rect.bottom + 4, left: rect.left }
        : { top: rect.bottom + 4, right: window.innerWidth - rect.right },
    );
  }, [anchor, align]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !anchor.contains(target)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div ref={menuRef} className={styles.menu} style={pos} role="menu">
      {title && <div className={styles.title}>{title}</div>}
      {items.length === 0 && emptyText && <div className={styles.empty}>{emptyText}</div>}
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className={styles.item}
          disabled={item.disabled}
          onClick={() => {
            onClose();
            item.onSelect();
          }}
        >
          <span>{item.label}</span>
          {item.hint && <span className={styles.hint}>{item.hint}</span>}
        </button>
      ))}
    </div>,
    document.body,
  );
}
