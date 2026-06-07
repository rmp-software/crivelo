import { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', disabled = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';

    const variantStyles = {
      primary: 'bg-[var(--brand)] text-[var(--fg-inverse)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-press)] shadow-sm hover:shadow-[var(--shadow-1)]',
      secondary: 'bg-[var(--bg-2)] text-[var(--fg)] hover:bg-[var(--bg-3)] active:bg-[var(--crema-300)] border border-[var(--border-strong)] hover:border-[var(--brand)]',
      danger: 'bg-[var(--danger)] text-white hover:bg-[#9E2F24] active:bg-[#842619] shadow-sm hover:shadow-[var(--shadow-1)]',
      ghost: 'text-[var(--fg-2)] hover:bg-[var(--bg-2)] active:bg-[var(--bg-3)] hover:text-[var(--fg)]',
    };

    const sizeStyles = {
      sm: 'text-sm px-3 py-1.5 rounded-[var(--radius-xs)] gap-1.5 min-h-[36px]',
      md: 'text-base px-4 py-2 rounded-[var(--radius-sm)] gap-2 min-h-[44px]',
      lg: 'text-lg px-6 py-3 rounded-[var(--radius-md)] gap-2.5 min-h-[52px]',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled}
        style={{ transitionDuration: 'var(--dur-base)', transitionTimingFunction: 'var(--ease-standard)' }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
