import { EmptyState } from '@/shared/ui/EmptyState';

/**
 * Lista das camadas do viewport (os "displays" do RViz): mapa, TF, scan…
 * Fase 0: vazio. O registry de camadas chega na fase 3.
 */
export function LayersPanel() {
  return <EmptyState title="Nenhuma camada" hint="Conecte um robô para ver as camadas disponíveis." />;
}
