import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

// Button no estilo HeroUI v3, recriado dentro do design system do TrainPro
// (CSS puro, sem @heroui/react/Tailwind — que exigiriam React 19 + Tailwind 4).
// Mesmas variants do HeroUI; o estilo vive em src/styles.css (classes .ui-btn).

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-soft';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa a largura total do container (útil em formulários/login). */
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block = false, className = '', children, ...rest },
  ref,
) {
  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    size !== 'md' ? `ui-btn--${size}` : '',
    block ? 'ui-btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default Button;
