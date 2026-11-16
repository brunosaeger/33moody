import type { SidebarTab } from '@/features/sidebar';
import { LayersPanel } from './LayersPanel';

/** Aba Camadas: o que é desenhado no viewport 3D (os "displays" do RViz). */
export const layersTab: SidebarTab = {
  id: 'layers',
  title: 'Camadas',
  content: LayersPanel,
};

/** Camadas ligadas, para renderizar dentro da cena 3D (usado pelo viewport). */
export { EnabledLayers } from './EnabledLayers';
