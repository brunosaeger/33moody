import { useCallback, useRef, useState } from 'react';
import { Menu, type MenuItem, type MenuProps } from './Menu';
import { Icon, type IconName } from './icons';
import styles from './MenuButton.module.css';

export interface MenuButtonProps
  extends Pick<MenuProps, 'title' | 'emptyText' | 'align' | 'searchable' | 'searchPlaceholder'> {
  /** Texto acessível (leitor de tela e tooltip). */
  label: string;
  icon: IconName;
  /** Chamado ao ABRIR o menu, então os itens refletem o estado atual. */
  getItems: () => MenuItem[];
}

/** Botão de ícone pequeno que abre um menu suspenso. */
export function MenuButton({ label, icon, getItems, ...menuProps }: MenuButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [items, setItems] = useState<MenuItem[] | null>(null);

  const close = useCallback(() => setItems(null), []);
  const toggle = () => setItems((open) => (open ? null : getItems()));

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        title={label}
        aria-label={label}
        aria-expanded={items !== null}
        data-open={items !== null || undefined}
        // Impede que o clique comece um arraste no container (ex.: grade de componentes).
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggle}
      >
        <Icon name={icon} />
      </button>
      {items && buttonRef.current && (
        <Menu anchor={buttonRef.current} items={items} onClose={close} {...menuProps} />
      )}
    </>
  );
}
