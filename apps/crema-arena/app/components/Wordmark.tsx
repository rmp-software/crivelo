interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  showMonogram?: boolean;
  className?: string;
  /** Color variant — `dark` (default) for cream backgrounds, `light` for espresso surfaces. */
  variant?: 'dark' | 'light';
}

/**
 * Crema Arena wordmark: Instrument Serif italic "Crema" + Bricolage Grotesque
 * bold "Arena" in cinnamon. Optionally preceded by the concentric-rings
 * monogram.
 */
export default function Wordmark({
  size = 'md',
  showMonogram = true,
  className = '',
  variant = 'dark',
}: WordmarkProps) {
  const sizes = {
    sm: { mono: 24, type: 'text-lg' },
    md: { mono: 32, type: 'text-2xl' },
    lg: { mono: 44, type: 'text-4xl' },
  } as const;
  const { mono, type } = sizes[size];

  const cremaColor =
    variant === 'light' ? 'var(--crema-50)' : 'var(--fg)';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {showMonogram && (
        <img
          src="/assets/monogram.svg"
          alt=""
          aria-hidden
          width={mono}
          height={mono}
          className="flex-shrink-0"
        />
      )}
      <span className={`leading-none ${type}`}>
        <span
          className="font-serif italic"
          style={{ color: cremaColor }}
        >
          Crema
        </span>
        <span
          className="font-display font-extrabold ml-1.5"
          style={{ color: 'var(--brand)' }}
        >
          Arena
        </span>
      </span>
    </div>
  );
}
