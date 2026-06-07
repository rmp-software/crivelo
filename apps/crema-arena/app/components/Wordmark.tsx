interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  showMonogram?: boolean;
  className?: string;
  /** Color variant — `dark` (default) for cream backgrounds, `light` for espresso surfaces. */
  variant?: 'dark' | 'light';
  /** Show the quiet "by Crivelo" endorsement lockup beneath the wordmark. */
  endorsement?: boolean;
}

/**
 * Crema Arena wordmark: Instrument Serif italic "Crema" + Bricolage Grotesque
 * bold "Arena" in cinnamon. Optionally preceded by the concentric-rings
 * monogram, and optionally endorsed with a quiet "by Crivelo" lockup (the house
 * framing its product — "by" lowercase, Geist, ~40% of the wordmark).
 */
export default function Wordmark({
  size = 'md',
  showMonogram = true,
  className = '',
  variant = 'dark',
  endorsement = false,
}: WordmarkProps) {
  const sizes = {
    sm: { mono: 24, type: 'text-lg', by: 'text-[9px]' },
    md: { mono: 32, type: 'text-2xl', by: 'text-[11px]' },
    lg: { mono: 44, type: 'text-4xl', by: 'text-sm' },
  } as const;
  const { mono, type, by } = sizes[size];

  const cremaColor = variant === 'light' ? 'var(--crema-50)' : 'var(--fg)';
  const byMuted = variant === 'light' ? 'var(--crema-300)' : 'var(--fg-3)';
  const byStrong = variant === 'light' ? 'var(--crema-50)' : 'var(--fg)';

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
      <span className="inline-flex flex-col leading-none">
        <span className={`leading-none ${type}`}>
          <span className="font-serif italic" style={{ color: cremaColor }}>
            Crema
          </span>
          <span
            className="font-display font-extrabold ml-1.5"
            style={{ color: 'var(--brand)' }}
          >
            Arena
          </span>
        </span>
        {endorsement && (
          <span
            className={`font-body mt-1.5 ${by}`}
            style={{ color: byMuted, letterSpacing: '0.01em' }}
          >
            by{' '}
            <span style={{ color: byStrong, fontWeight: 600 }}>Crivelo</span>
          </span>
        )}
      </span>
    </div>
  );
}
