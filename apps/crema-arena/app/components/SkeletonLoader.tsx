interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'table' | 'avatar';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({ type = 'text', count = 1, className = '' }: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-[var(--bg-3)] rounded-[var(--radius-sm)]';

  const renderSkeleton = () => {
    switch (type) {
      case 'avatar':
        return <div className={`${baseClasses} w-12 h-12 rounded-full`} />;

      case 'card':
        return (
          <div className={`${baseClasses} p-6 space-y-4`}>
            <div className="h-6 bg-[var(--bg-3)] rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-[var(--bg-3)] rounded" />
              <div className="h-4 bg-[var(--bg-3)] rounded w-5/6" />
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`${baseClasses} h-12 w-full`} />
            ))}
          </div>
        );

      case 'text':
      default:
        return <div className={`${baseClasses} h-4 w-full`} />;
    }
  };

  return (
    <div className={className} role="status" aria-label="Carregando conteúdo">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={count > 1 ? 'mb-4' : ''}>
          {renderSkeleton()}
        </div>
      ))}
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
