import { HTMLAttributes, forwardRef } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[var(--radius-full)] whitespace-nowrap';

    const variantStyles = {
      default: 'bg-[var(--bg-3)] text-[var(--fg-2)]',
      success: 'bg-[var(--live-soft)] text-[var(--live)]',
      warning: 'bg-[var(--gold-soft)] text-[var(--gold)]',
      danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
    };

    const sizeStyles = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-1',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
