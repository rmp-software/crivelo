import { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)]"
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div
          className="mb-4 p-4 rounded-full bg-[var(--bg-2)]"
          aria-hidden="true"
        >
          <Icon size={48} className="text-[var(--fg-3)]" />
        </div>
      )}
      <h3 className="text-xl font-display font-semibold text-[var(--fg-2)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[var(--fg-3)] mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          aria-label={action.label}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
