import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { followTopic, useClock, useSession } from '@/data';
import type { TFMessage } from '@/lib/ros';
import { TF_TOPICS, TfTree } from '@/lib/tf';

const TfContext = createContext<TfTree | null>(null);

/**
 * Mantém UMA árvore de TF para a cena inteira, alimentada por /tf_static
 * (frames fixos do robô, chegam uma vez) e /tf (frames que se movem).
 * A árvore é mutável: quem lê consulta dentro do `useFrame`, sem re-render.
 *
 * No replay só existe a última mensagem de /tf até o cursor (o demo nem
 * publica TF). A reconstrução completa no tempo fica para o motor de replay.
 */
export function TfTreeProvider({ children }: { children: ReactNode }) {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  // Árvore nova a cada fonte ou modo: frames de outra sessão não se misturam.
  const tree = useMemo(() => new TfTree(), [source, mode]);

  useEffect(() => {
    if (!source) return;
    const stops = [TF_TOPICS.static, TF_TOPICS.dynamic].map((topic) =>
      followTopic(source, topic, mode, (event) => {
        if (event) tree.update(event.message as TFMessage, topic === TF_TOPICS.static);
      }),
    );
    return () => stops.forEach((stop) => stop());
  }, [source, mode, tree]);

  return <TfContext.Provider value={tree}>{children}</TfContext.Provider>;
}

/** A árvore de TF da cena. Consultar dentro de `useFrame`. */
export function useTfTree(): TfTree {
  const tree = useContext(TfContext);
  if (!tree) throw new Error('useTfTree precisa estar dentro de <TfTreeProvider>');
  return tree;
}
