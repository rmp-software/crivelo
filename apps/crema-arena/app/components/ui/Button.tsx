import { ButtonHTMLAttributes } from 'react';
import { Button as ShadcnButton } from '@crivelo/ui/ui/button';
import { cn } from '@crivelo/ui/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Arena Button — thin wrapper over the shared shadcn Button (`@crivelo/ui/ui/button`).
 *
 * RMP-205: maps the legacy product API onto the shared primitive so every call site
 * keeps its props while rendering the shadcn Button (cinnamon via the alias layer):
 *   - variant: primary→default, secondary→secondary, danger→destructive, ghost→ghost
 *   - size:    sm→sm, md→default (omit), lg→lg
 *   - fullWidth → w-full
 *
 * Crema wants bigger buttons: the shadcn size scale (default h-9=36px, lg h-10=40px)
 * sits below the app_spec <styling_conventions> ≥44px tap-target floor, so each size
 * is bumped back to the pre-migration heights via min-h (sm/md 44px, lg 52px). The
 * shadcn fixed `h-*` is overridden to `h-auto` so min-h governs.
 */
const variantMap = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  ghost: 'ghost',
} as const;

const sizeMap = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
} as const;

// Pre-migration heights, restored so buttons clear the ≥44px tap-target floor.
const sizeHeights = {
  sm: 'h-auto min-h-[44px]',
  md: 'h-auto min-h-[44px]',
  lg: 'h-auto min-h-[52px]',
} as const;

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <ShadcnButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={cn(sizeHeights[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}
