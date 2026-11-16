import type { SidebarTab } from '@/features/sidebar';
import { AddComponentButton } from './AddComponentButton';
import { ComponentBoard } from './ComponentBoard';

/**
 * Aba Componentes: o técnico monta o que quer acompanhar escolhendo
 * tópicos pelo "+".
 */
export const componentsTab: SidebarTab = {
  id: 'components',
  title: 'Componentes',
  content: ComponentBoard,
  action: AddComponentButton,
};
