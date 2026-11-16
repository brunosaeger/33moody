import type { SidebarTab } from '@/features/sidebar';
import { layersTab } from '@/features/layers';
import { componentsTab } from '@/features/robot-components';

/**
 * Composição do menu lateral: o ÚNICO lugar que conhece todas as abas.
 * Feature nova com aba = exportar um SidebarTab e registrar aqui (a ordem
 * desta lista é a ordem das abas).
 */
export const sidebarTabs: readonly SidebarTab[] = [layersTab, componentsTab];
