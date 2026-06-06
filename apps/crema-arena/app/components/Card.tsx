import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md';
  border?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', shadow = 'sm', border = true, className = '', children, ...props }, ref) => {
    const baseStyles = 'bg-[var(--surface-raised)] rounded-[var(--radius-md)]';

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    const shadowStyles = {
      none: '',
      sm: 'shadow-[var(--shadow-1)]',
      md: 'shadow-[var(--shadow-2)]',
    };

    const borderStyle = border ? 'border border-[var(--border)]' : '';

    const combinedClassName = `${baseStyles} ${paddingStyles[padding]} ${shadowStyles[shadow]} ${borderStyle} ${className}`;

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
