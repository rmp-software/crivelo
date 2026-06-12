import { HTMLAttributes } from 'react';
import { Card as ShadcnCard } from '@crivelo/ui/card';
import { cn } from '@crivelo/ui/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md';
  border?: boolean;
}

/**
 * Arena Card — thin wrapper over the shared shadcn Card (`@crivelo/ui/card`).
 *
 * RMP-205: the product uses Card as a single padded surface, so this maps the
 * legacy padding / shadow / border props onto the shared primitive and neutralizes
 * the shadcn defaults (py-6, gap-6, rounded-xl, shadow-sm, flex flex-col) so the
 * surface renders identically to before:
 *   - layout:  block (over shadcn `flex flex-col`) — the legacy Card was a plain
 *              <div>; keeping flex would make children flex items (min-width:0,
 *              changed stacking), a layout regression
 *   - surface: bg-card (= --surface-raised) inherited from the primitive
 *   - radius:  --radius-md (over shadcn rounded-xl)
 *   - padding: none/sm/md/lg → ''/p-3/p-6/p-8 (over shadcn py-6)
 *   - shadow:  none/sm/md → ''/--shadow-1/--shadow-2 (over shadcn shadow-sm)
 *   - border:  on by default (the primitive already renders a border)
 */
const paddingClasses = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
} as const;

const shadowClasses = {
  none: 'shadow-none',
  sm: 'shadow-1',
  md: 'shadow-2',
} as const;

export default function Card({
  padding = 'md',
  shadow = 'sm',
  border = true,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <ShadcnCard
      className={cn(
        'block gap-0 rounded-md py-0',
        paddingClasses[padding],
        shadowClasses[shadow],
        !border && 'border-0',
        className
      )}
      {...props}
    >
      {children}
    </ShadcnCard>
  );
}
