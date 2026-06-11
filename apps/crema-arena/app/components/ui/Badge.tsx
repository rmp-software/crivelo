import { HTMLAttributes } from 'react';
import { Badge as ShadcnBadge } from '@crivelo/ui/ui/badge';
import { cn } from '@crivelo/ui/lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

/**
 * Arena Badge — thin wrapper over the shared shadcn Badge (`@crivelo/ui/ui/badge`).
 *
 * RMP-205: the four product Badge variants (default / success / warning / danger)
 * have no 1:1 shadcn equivalent, so they are reproduced here with the exact house
 * color tokens the deprecated hand-rolled Badge used — keeping the rendered badges
 * pixel-identical while the underlying primitive is the shared one:
 *   - default → neutral chip   (--bg-3 / --fg-2)
 *   - success → live/sage      (--live-soft / --live)
 *   - warning → gold/marigold  (--gold-soft / --gold)
 *   - danger  → soft clay       (--danger-soft / --danger)
 *
 * The shadcn base variant is chosen to be semantically closest (danger→destructive,
 * the rest→secondary for a neutral transparent-bordered chip); the bg/text utilities
 * below win via tailwind-merge (last-wins), so colors are unaffected by the base. We
 * also surface the real semantic on `data-variant` (shadcn writes its own base value
 * there, so this app-level attribute is the honest one for any future selectors).
 */
const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-3)] text-[var(--fg-2)]',
  success: 'bg-[var(--live-soft)] text-[var(--live)]',
  warning: 'bg-[var(--gold-soft)] text-[var(--gold)]',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
};

// shadcn base per semantic variant — closest match, purely for border/structure;
// colors come from variantClasses (last-wins). Kept neutral so nothing regresses.
const shadcnBase: Record<BadgeVariant, 'secondary' | 'destructive'> = {
  default: 'secondary',
  success: 'secondary',
  warning: 'secondary',
  danger: 'destructive',
};

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export default function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <ShadcnBadge
      variant={shadcnBase[variant]}
      data-variant={variant}
      className={cn(variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </ShadcnBadge>
  );
}
