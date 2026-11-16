import { Header } from '@/features/header';
import { SidebarLayout } from '@/features/sidebar';
import { Timeline } from '@/features/timeline';
import { Viewport } from '@/features/viewport';
import { sidebarTabs } from './sidebarTabs';
import styles from './App.module.css';

/**
 * A tela única do 33moody: header no topo; embaixo, o viewport e o menu
 * lateral direito; no rodapé, a timeline (só com robô conectado).
 */
export function App() {
  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <SidebarLayout tabs={sidebarTabs}>
          <Viewport />
        </SidebarLayout>
      </main>
      <Timeline />
    </div>
  );
}
