import type { FunctionComponent } from 'react';
import type { RobotProfile } from '@/config/robotProfiles';

export interface LayerProps {
  profile: RobotProfile;
}

/**
 * Contrato de uma camada (um "display" do RViz).
 * Camada nova = uma pasta em `features/layers/<nome>/` exportando uma
 * definição destas, registrada em `registry.ts`.
 */
export interface LayerDefinition {
  /** Chave estável: fica salva no estado liga/desliga. */
  id: string;
  title: string;
  /** Uma linha explicando o que a camada desenha (aparece na aba Camadas). */
  description: string;
  /** Tópico(s) que alimentam a camada, para exibição. */
  topics: (profile: RobotProfile) => string[];
  defaultEnabled: boolean;
  /** Componente 3D (react-three-fiber), renderizado dentro da cena. */
  Component: FunctionComponent<LayerProps>;
}
