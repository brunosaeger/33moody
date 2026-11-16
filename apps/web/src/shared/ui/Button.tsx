import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = ação principal (ciano); ghost = discreto, só contorno. */
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
}

/** Botão padrão do 33moody (estilo LIFTYMapper: contorno + acento). */
export function Button({ variant = 'ghost', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ');
  return <button type={type} className={classes} {...rest} />;
}
