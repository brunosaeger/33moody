import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { MessageEvent } from '@moody/data-sources';
import { followTopic, useClock, useSession } from '@/data';
import type { TFMessage } from '@/lib/ros';
import { TF_TOPICS, TfTree } from '@/lib/tf';

/**
 * Quanto do passado de /tf entra na árvore do replay. Precisa cobrir o
 * atraso dos sensores (o scan é posicionado no stamp dele) e a mensagem
 * mais espaçada da árvore (o AMCL publica `map → odom` a ~5 Hz).
 */
const REPLAY_TF_WINDOW_MS = 3000;

const TfContext = createContext<TfTree | null>(null);

type RangeReader = (topic: string, startMs: number, endMs: number) => MessageEvent[];

/**
 * Replay: reconstrói a árvore no instante do cursor com todos os
 * /tf_static até ali e os /tf dos últimos segundos. A "última mensagem"
 * não basta, porque cada mensagem de /tf traz só parte da árvore.
 */
function followTfReplay(messagesInRange: RangeReader, tree: TfTree): () => void {
  const rebuild = () => {
    const t = useClock.getState().cursorMs;
    tree.resetTransforms();
    for (const e of messagesInRange(TF_TOPICS.static, -Infinity, t)) tree.update(e.message as TFMessage, true);
    for (const e of messagesInRange(TF_TOPICS.dynamic, t - REPLAY_TF_WINDOW_MS, t)) {
      tree.update(e.message as TFMessage);
    }
  };
  rebuild();
  return useClock.subscribe((s, prev) => {
    if (s.cursorMs !== prev.cursorMs || s.range !== prev.range) rebuild();
  });
}

/**
 * Mantém UMA árvore de TF para a cena inteira, alimentada por /tf_static
 * (frames fixos do robô) e /tf (frames que se movem).
 * A árvore é mutável: quem lê consulta dentro do `useFrame`, sem re-render.
 *
 * - Ao vivo: acumula as mensagens que chegam.
 * - Replay com `messagesInRange` (gravação): reconstrói no instante do cursor.
 * - Replay sem isso (demo): só a última mensagem até o cursor.
 */
export function TfTreeProvider({ children }: { children: ReactNode }) {
  const source = useSession((s) => s.source);
  const mode = useClock((s) => s.mode);
  // Árvore nova a cada fonte ou modo: frames de outra sessão não se misturam.
  const tree = useMemo(() => new TfTree(), [source, mode]);

  useEffect(() => {
    if (!source) return;
    if (mode === 'replay' && source.messagesInRange) {
      return followTfReplay((topic, a, b) => source.messagesInRange!(topic, a, b), tree);
    }
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
