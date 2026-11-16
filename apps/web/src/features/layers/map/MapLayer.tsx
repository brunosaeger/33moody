import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { DataTexture } from 'three';
import { useTopicRef } from '@/data';
import type { OccupancyGrid } from '@/lib/ros';
import type { LayerProps } from '../types';
import { occupancyToTexture } from './occupancyTexture';

/** Levemente acima da grade de chão (z = 0), para não "brigar" com ela. */
const MAP_Z = 0.002;

interface MapView {
  texture: DataTexture;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

/** Mapa (OccupancyGrid) como um plano texturizado, em metros no frame map. */
export function MapLayer({ profile }: LayerProps) {
  const message = useTopicRef<OccupancyGrid>(profile.topics.map);
  const lastData = useRef<unknown>(null);
  const [view, setView] = useState<MapView | null>(null);

  // O mapa muda raramente: só reconstrói a textura quando o grid é outro.
  useFrame(() => {
    const grid = message.current?.message;
    if (!grid || grid.data === lastData.current) return;
    lastData.current = grid.data;
    const { resolution, width, height, origin } = grid.info;
    const w = width * resolution;
    const h = height * resolution;
    setView({
      texture: occupancyToTexture(grid),
      width: w,
      height: h,
      cx: origin.position.x + w / 2,
      cy: origin.position.y + h / 2,
    });
  });

  // Libera a textura antiga da GPU ao trocar de mapa ou desmontar.
  useEffect(() => () => view?.texture.dispose(), [view]);

  if (!view) return null;
  return (
    <mesh position={[view.cx, view.cy, MAP_Z]}>
      <planeGeometry args={[view.width, view.height]} />
      {/* toneMapped={false}: o mapa mostra as cores exatas do tema, sem "filtro" de iluminação */}
      <meshBasicMaterial map={view.texture} transparent toneMapped={false} />
    </mesh>
  );
}
