import { useSidebarStore } from './sidebarStore';
import type { SidebarTab } from './types';
import styles from './Sidebar.module.css';

/**
 * Menu lateral direito: barra de abas + conteúdo da aba ativa.
 * Só a aba ativa fica montada (as outras não assinam tópicos à toa).
 */
export function Sidebar({ tabs }: { tabs: readonly SidebarTab[] }) {
  const activeTabId = useSidebarStore((s) => s.activeTabId);
  const setActiveTab = useSidebarStore((s) => s.setActiveTab);

  // Aba salva pode não existir mais (renomeada/removida): cai na primeira.
  const active = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  if (!active) return null;

  const Content = active.content;
  const Action = active.action;

  return (
    <div className={styles.sidebar}>
      <div className={styles.tabBar} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active.id}
            className={styles.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.title}
          </button>
        ))}
        <div className={styles.spacer} />
        {Action && (
          <div className={styles.action}>
            <Action />
          </div>
        )}
      </div>
      <div className={styles.content} role="tabpanel" aria-label={active.title}>
        <Content />
      </div>
    </div>
  );
}
