import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = false, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    const baseInputStyles = 'w-full px-3 py-2 rounded-[var(--radius-sm)] border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--surface)] text-[var(--fg)]';

    const errorStyles = hasError
      ? 'border-[var(--danger)] focus:border-[var(--danger)]'
      : 'border-[var(--border-strong)] focus:border-[var(--brand)]';

    const inputClassName = `${baseInputStyles} ${errorStyles} ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--fg-2)] mb-1.5"
          >
            {label}
            {props.required && <span className="text-[var(--danger)] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClassName}
          style={{ transitionDuration: 'var(--dur-base)', transitionTimingFunction: 'var(--ease-standard)' }}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-[var(--fg-3)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
