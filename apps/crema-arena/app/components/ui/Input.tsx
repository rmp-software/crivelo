import { InputHTMLAttributes } from 'react';
import { Input as ShadcnInput } from '@crivelo/ui/input';
import { cn } from '@crivelo/ui/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Arena Input — thin wrapper over the shared shadcn Input (`@crivelo/ui/input`).
 *
 * RMP-205: the product forms compose a label / required-asterisk / error / helper
 * around the field. The shared primitive is the bare <input>, so that surrounding
 * markup lives here. The field-level token classes reproduce the previous look
 * exactly (raised cream surface, strong border, --radius-sm, py-2) so migrating to
 * the shared primitive is visually a no-op:
 *   - bg            → --surface          (over shadcn bg-transparent)
 *   - border color  → --border-strong    (over shadcn border-input)
 *   - radius / pad  → --radius-sm / py-2  (over shadcn rounded-md / py-1)
 *   - height/shadow → auto / none        (drop shadcn h-9 / shadow-xs)
 *
 * React 19: ref is a plain prop — no forwardRef needed.
 */
export default function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ref,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = !!error;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-fg-2 mb-1.5"
        >
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <ShadcnInput
        ref={ref}
        id={inputId}
        aria-invalid={hasError}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        className={cn(
          'h-auto rounded-sm border bg-surface py-2 text-fg shadow-none',
          hasError
            ? 'border-danger focus-visible:border-danger'
            : 'border-border-strong focus-visible:border-brand',
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-fg-3">
          {helperText}
        </p>
      )}
    </div>
  );
}
