import { useRef, type ComponentProps } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Object3D } from 'three';

/** O objeto e todos os pais estão visíveis? (`visible` do three não é herdado pelo HTML.) */
function isShown(obj: Object3D | null): boolean {
  for (let o = obj; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/**
 * Rótulo HTML preso a um ponto da cena (`Html` do drei) que SOME junto com
 * o objeto 3D. O `Html` é um elemento da página sobreposto ao canvas e
 * ignora o `visible` do three: sem isto, um frame sem dado no instante
 * esconderia os eixos, mas deixaria o nome "congelado" na última posição.
 * Usa `visibility`, porque o `display` o próprio drei usa para oclusão.
 */
export function SceneLabel({ children, ...htmlProps }: ComponentProps<typeof Html>) {
  const anchor = useRef<Object3D>(null);
  const label = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (label.current) label.current.style.visibility = isShown(anchor.current) ? '' : 'hidden';
  });

  return (
    <object3D ref={anchor}>
      <Html ref={label} {...htmlProps}>
        {children}
      </Html>
    </object3D>
  );
}
