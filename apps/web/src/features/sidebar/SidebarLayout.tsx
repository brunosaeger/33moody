import type { ReactNode } from 'react';
import { SplitPane } from '@/shared/ui/SplitPane';
import { Sidebar } from './Sidebar';
import { MIN_VIEWPORT_WIDTH, SIDEBAR_WIDTH, useSidebarStore } from './sidebarStore';
import type { SidebarTab } from './types';

interface SidebarLayoutProps {
  /** Área principal, à esquerda do menu (o viewport). */
  children: ReactNode;
  tabs: readonly SidebarTab[];
}

/** Área principal + menu lateral direito com largura ajustável (e salva). */
export function SidebarLayout({ children, tabs }: SidebarLayoutProps) {
  const width = useSidebarStore((s) => s.width);
  const setWidth = useSidebarStore((s) => s.setWidth);

  return (
    <SplitPane
      main={children}
      side={<Sidebar tabs={tabs} />}
      sideWidth={width}
      onSideWidthChange={setWidth}
      minSide={SIDEBAR_WIDTH.min}
      maxSide={SIDEBAR_WIDTH.max}
      minMain={MIN_VIEWPORT_WIDTH}
      defaultSide={SIDEBAR_WIDTH.default}
    />
  );
}
