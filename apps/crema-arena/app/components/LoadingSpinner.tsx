interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={`inline-block rounded-full border-[var(--brand)] border-t-transparent animate-spin ${sizeClasses[size]} ${className}`}
      style={{
        animationDuration: 'var(--dur-stage)',
        animationTimingFunction: 'linear',
      }}
      role="status"
      aria-label="Carregando"
    />
  );
}
