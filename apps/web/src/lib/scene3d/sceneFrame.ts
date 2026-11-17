import type { RobotProfile } from '@/config/robotProfiles';
import type { TfTree } from '@/lib/tf';

/**
 * Frame em que a cena está sendo desenhada (o "Fixed Frame" do RViz).
 * Normalmente o `fixedFrame` do perfil (`map`). Se ele ainda não existe
 * na árvore (ex.: o AMCL ainda não recebeu a pose inicial), usa o plano B
 * (`odom`) para o robô continuar aparecendo.
 */
export function sceneFrame(tree: TfTree, profile: RobotProfile): string {
  if (profile.pose.kind !== 'tf') return 'map';
  const { fixedFrame, fallbackFrame } = profile.pose;
  return !tree.has(fixedFrame) && fallbackFrame && tree.has(fallbackFrame) ? fallbackFrame : fixedFrame;
}
