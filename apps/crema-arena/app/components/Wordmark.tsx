interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  showMonogram?: boolean;
  className?: string;
  /** Color variant — `dark` (default) for cream backgrounds, `light` for espresso surfaces. */
  variant?: 'dark' | 'light';
  /** Show the quiet "by Crivelo" endorsement lockup tucked under the wordmark. */
  endorsement?: boolean;
}

/**
 * Crema Arena wordmark: Instrument Serif italic "Crema" + Bricolage Grotesque
 * bold "Arena" in cinnamon. Optionally preceded by the concentric-rings
 * monogram, and optionally endorsed with a quiet "by Crivelo" lockup — tucked
 * small and muted at the wordmark's bottom-right (quiet credit, never competing
 * with the product name). "by" is always lowercase.
 */
export default function Wordmark({
  size = 'md',
  showMonogram = true,
  className = '',
  variant = 'dark',
  endorsement = false,
}: WordmarkProps) {
  const sizes = {
    sm: { mono: 24, type: 'text-lg', by: 'text-[10px]' },
    md: { mono: 32, type: 'text-2xl', by: 'text-xs' },
    lg: { mono: 44, type: 'text-4xl', by: 'text-sm' },
  } as const;
  const { mono, type, by } = sizes[size];

  const cremaColorCls = variant === 'light' ? 'text-crema-50' : 'text-fg';
  const byColorCls = variant === 'light' ? 'text-crema-300' : 'text-fg-3';

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
      <span className="relative inline-flex leading-none">
        <span className={`leading-none ${type}`}>
          <span className={`font-serif italic ${cremaColorCls}`}>
            Crema
          </span>
          <span className={`font-display font-extrabold ml-1.5 text-brand`}>
            Arena
          </span>
        </span>
        {endorsement && (
          <span
            className={`absolute right-0 bottom-0 font-body whitespace-nowrap ${by} ${byColorCls}`}
            style={{
              letterSpacing: '0.01em',
              transform: 'translateY(50%) scale(0.9)',
              transformOrigin: 'right',
            }}
          >
            by Crivelo
          </span>
        )}
      </span>
    </div>
  );
}
