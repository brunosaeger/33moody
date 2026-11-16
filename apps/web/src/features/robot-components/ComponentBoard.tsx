import { useMemo } from 'react';
import ReactGridLayout, { useContainerWidth, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { EmptyState } from '@/shared/ui/EmptyState';
import { GRID, MIN_WIDGET_SIZE } from './board';
import { useBoardStore } from './boardStore';
import { ComponentWidget, DRAG_HANDLE_CLASS, NO_DRAG_CLASS } from './ComponentWidget';
import styles from './ComponentBoard.module.css';

/**
 * Conteúdo da aba Componentes: uma grade onde ficam os componentes
 * (um por tópico), arrastáveis pelo cabeçalho e redimensionáveis pelo canto.
 * A largura acompanha o menu lateral (useContainerWidth observa o container).
 */
export function ComponentBoard() {
  const board = useBoardStore((s) => s.board);
  const applyLayout = useBoardStore((s) => s.applyLayout);
  const removeWidget = useBoardStore((s) => s.removeWidget);
  const { width, containerRef, mounted } = useContainerWidth();

  const layout = useMemo<Layout>(
    () =>
      board.widgets.map((w) => ({
        i: w.id,
        ...w.layout,
        minW: MIN_WIDGET_SIZE.w,
        minH: MIN_WIDGET_SIZE.h,
      })),
    [board],
  );

  return (
    <div ref={containerRef} className={styles.board}>
      {board.widgets.length === 0 ? (
        <EmptyState title="Nenhum componente" hint="Use o + para adicionar um componente (tópico ROS)." />
      ) : (
        mounted && (
          <ReactGridLayout
            className={styles.grid}
            layout={layout}
            width={width}
            gridConfig={{ cols: GRID.cols, rowHeight: GRID.rowHeight, margin: GRID.margin }}
            dragConfig={{ handle: `.${DRAG_HANDLE_CLASS}`, cancel: `.${NO_DRAG_CLASS}` }}
            resizeConfig={{ handles: ['se'] }}
            onLayoutChange={applyLayout}
          >
            {board.widgets.map((w) => (
              <div key={w.id}>
                <ComponentWidget widget={w} onRemove={() => removeWidget(w.id)} />
              </div>
            ))}
          </ReactGridLayout>
        )
      )}
    </div>
  );
}
