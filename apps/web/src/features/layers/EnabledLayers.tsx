import { useRobotProfile } from '@/data';
import { isLayerEnabled, useLayersStore } from './layersStore';
import { LAYERS } from './registry';

/** Renderiza, dentro da cena 3D, as camadas que estão ligadas. */
export function EnabledLayers() {
  const enabled = useLayersStore((s) => s.enabled);
  const profile = useRobotProfile();

  return (
    <>
      {LAYERS.filter((l) => isLayerEnabled(enabled, l.id, l.defaultEnabled)).map(({ id, Component }) => (
        <Component key={id} profile={profile} />
      ))}
    </>
  );
}
