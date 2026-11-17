/**
 * Ícones SVG da aplicação (traço, 16×16, herdam `currentColor`).
 * Ícone novo = uma entrada nova em `paths`.
 */
const paths = {
  plus: 'M8 3v10M3 8h10',
  close: 'M4 4l8 8M12 4l-8 8',
  play: 'M5 3.2v9.6l7.5-4.8z',
  pause: 'M5 3.5v9M11 3.5v9',
  skipBack: 'M8 4L4 8l4 4M13 4L9 8l4 4',
  skipForward: 'M8 4l4 4-4 4M3 4l4 4-4 4',
  calendar: 'M2.5 4h11v9.5h-11zM2.5 6.5h11M5.5 2.5v3M10.5 2.5v3',
  /** Uma mensagem para trás / para frente (seta + barra, como "quadro a quadro"). */
  stepBack: 'M10.5 4L6.5 8l4 4M4 4v8',
  stepForward: 'M5.5 4l4 4-4 4M12 4v8',
} as const;

export type IconName = keyof typeof paths;

/** Ícones de forma fechada que ficam melhores preenchidos. */
const FILLED: ReadonlySet<IconName> = new Set(['play']);

export function Icon({ name, size = 12 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill={FILLED.has(name) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
