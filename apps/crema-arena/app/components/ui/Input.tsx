import { InputHTMLAttributes, forwardRef } from 'react';
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
 * forwardRef preserves the legacy hand-rolled Input's API contract (the field was a
 * forwardRef so call sites can reach the <input>). NOTE: the shared @crivelo/ui
 * Input is currently a plain function component (not forwardRef), so the ref does
 * NOT presently reach the underlying <input>. Forwarding it here is harmless and
 * keeps the contract ready for when the shared primitive forwards refs.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    fullWidth = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = !!error;

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
      <ShadcnInput
        ref={ref}
        id={inputId}
        aria-invalid={hasError}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        className={cn(
          'h-auto rounded-[var(--radius-sm)] border bg-[var(--surface)] py-2 text-[var(--fg)] shadow-none',
          hasError
            ? 'border-[var(--danger)] focus-visible:border-[var(--danger)]'
            : 'border-[var(--border-strong)] focus-visible:border-[var(--brand)]',
          className
        )}
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
});

export default Input;
