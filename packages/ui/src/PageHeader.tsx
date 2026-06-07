import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-[var(--fg-3)]">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-[var(--brand)] transition-colors"
                    style={{ transitionDuration: 'var(--dur-base)' }}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-[var(--fg-2)] font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-[var(--fg)] mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-base md:text-lg text-[var(--fg-2)] max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Actions Slot */}
        {actions && (
          <div className="flex items-center gap-2 md:gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
