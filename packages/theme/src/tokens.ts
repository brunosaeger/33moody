/**
 * Tokens visuais do 33moody: a FONTE ÚNICA da paleta e da tipografia.
 *
 * - O CSS recebe estes valores como custom properties (ver `applyTheme.ts`).
 * - O Three.js (viewport 3D) importa `colors` direto, porque o canvas WebGL
 *   não lê CSS.
 *
 * Paleta herdada do LIFTYMapper (assinatura visual da 33Robotics).
 *
 * Regra: cor de acento/estado é FUNCIONAL (significa algo), não decorativa.
 * Se for criar um tema claro no futuro, só os tokens de superfície e texto
 * mudam; acentos e estados mantêm o matiz.
 */

export const colors = {
  // Superfícies, da mais funda para a mais elevada
  panelBase: '#0e1116',
  panelRaised: '#171c22',
  panelRaisedHi: '#1e242c',
  panelLine: '#262e38',

  // Texto
  textPrimary: '#edeff3',
  textMuted: '#8a93a3',

  // Acentos
  accentAmber: '#f5a524',
  accentAmberDim: '#8a611c',
  accentCyan: '#2dd4bf',
  accentCyanDim: '#1c766c',

  // Estados
  stateError: '#f45b69',
  stateSuccess: '#4ade80',
  stateWarn: '#facc15',

  // Marca ("33" do logotipo)
  brand: '#f5522a',
} as const;

export const fonts = {
  ui: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  /** Helvetica; no Linux cai na Nimbus Sans (clone métrico dela). */
  brand: "Helvetica, 'Helvetica Neue', 'Nimbus Sans', 'Nimbus Sans L', Arial, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Code', 'JetBrains Mono', monospace",
} as const;

export const radii = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  /** Barra da timeline (retângulo arredondado). */
  pill: '14px',
} as const;

export const sizes = {
  headerHeight: '56px',
} as const;

export type ColorToken = keyof typeof colors;
