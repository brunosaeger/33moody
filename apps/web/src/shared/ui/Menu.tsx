import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
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
  /**
   * Campo de busca no topo (para listas longas, como os tópicos de um robô).
   * Filtra por texto no rótulo e na dica; ↑ ↓ navegam e Enter escolhe.
   */
  searchable?: boolean;
  searchPlaceholder?: string;
}

/** Todas as palavras da busca aparecem no rótulo ou na dica (sem diferenciar maiúsculas). */
function matches(item: MenuItem, query: string): boolean {
  const text = `${item.label} ${item.hint ?? ''}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
}

/**
 * Menu suspenso genérico.
 * Renderizado num portal no <body>, então não é cortado por containers com
 * `overflow: hidden` (como o menu lateral e os componentes).
 * Fecha ao clicar fora, ao apertar Esc ou ao escolher um item.
 */
export function Menu({
  anchor,
  items,
  onClose,
  title,
  emptyText,
  align = 'left',
  searchable = false,
  searchPlaceholder = 'Buscar…',
}: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const shown = useMemo(() => (query ? items.filter((i) => matches(i, query)) : items), [items, query]);

  const choose = (item: MenuItem | undefined) => {
    if (!item || item.disabled) return;
    onClose();
    item.onSelect();
  };

  const onSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (shown.length === 0 ? 0 : (i + step + shown.length) % shown.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(shown[active]);
    }
  };

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
      {searchable && items.length > 0 && (
        <input
          className={styles.search}
          autoFocus
          value={query}
          placeholder={searchPlaceholder}
          spellCheck={false}
          aria-label={searchPlaceholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onSearchKeyDown}
        />
      )}
      {items.length === 0 && emptyText && <div className={styles.empty}>{emptyText}</div>}
      {items.length > 0 && shown.length === 0 && <div className={styles.empty}>Nada encontrado para “{query}”</div>}
      {shown.map((item, i) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className={styles.item}
          data-active={(searchable && i === active) || undefined}
          disabled={item.disabled}
          onMouseEnter={() => setActive(i)}
          onClick={() => choose(item)}
        >
          <span>{item.label}</span>
          {item.hint && <span className={styles.hint}>{item.hint}</span>}
        </button>
      ))}
    </div>,
    document.body,
  );
}
