import type { FunctionComponent } from 'react';

/**
 * Contrato que cada feature usa para registrar uma aba no menu lateral.
 * O menu lateral não importa features; ele só recebe uma lista destas
 * (a composição fica em `app/sidebarTabs.ts`).
 */
export interface SidebarTab {
  /** Chave estável: fica salva como "aba ativa". Não renomeie à toa. */
  id: string;
  title: string;
  /** Conteúdo da aba. */
  content: FunctionComponent;
  /** Botão opcional no fim da barra de abas, visível quando esta aba está ativa (ex.: "+"). */
  action?: FunctionComponent;
}
