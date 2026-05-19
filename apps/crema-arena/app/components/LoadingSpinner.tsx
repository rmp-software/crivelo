interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Use the inverse palette for dark backgrounds (espresso surfaces). */
  variant?: 'dark' | 'light';
}

/**
 * Concentric crema rings loader. Three rings rotating at 1.4s / 2.1s
 * (reversed) / 3.2s in cinnamon / marigold / espresso — the brand motion
 * signature.
 */
export default function LoadingSpinner({
  size = 'md',
  className = '',
  variant = 'dark',
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 24,
    md: 40,
    lg: 64,
  } as const;
  const px = sizes[size];

  const innerColor =
    variant === 'light' ? 'var(--crema-50)' : 'var(--espresso-900)';

  return (
    <div
      role="status"
      aria-label="Carregando"
      className={`inline-block relative ${className}`}
      style={{ width: px, height: px }}
    >
      {/* Outer ring — cinnamon */}
      <span
        className="absolute inset-0 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: 'var(--cinnamon-500)',
          animation: 'rings-spin 1.4s linear infinite',
        }}
      />
      {/* Middle ring — marigold, reversed */}
      <span
        className="absolute rounded-full border-2 border-transparent"
        style={{
          inset: Math.max(2, Math.round(px * 0.16)),
          borderTopColor: 'var(--marigold-500)',
          animation: 'rings-spin-reverse 2.1s linear infinite',
        }}
      />
      {/* Inner ring — espresso (or crema on dark variant) */}
      <span
        className="absolute rounded-full border-2 border-transparent"
        style={{
          inset: Math.max(4, Math.round(px * 0.32)),
          borderTopColor: innerColor,
          animation: 'rings-spin 3.2s linear infinite',
        }}
      />
    </div>
  );
}
