'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = ++idRef.current;
      setToasts((current) => [...current, { id, message, variant }]);
      setTimeout(() => dismiss(id), DEFAULT_DURATION_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            role="region"
            aria-label="Notificações"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none"
          >
            {toasts.map((toast) => (
              <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const styles =
    toast.variant === 'error'
      ? 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]'
      : toast.variant === 'info'
        ? 'bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--brand)]'
        : 'bg-[var(--live-soft)] text-[var(--live)] border-[var(--live)]';

  const Icon = toast.variant === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className={`toast-enter pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-2)] border min-w-[280px] max-w-[420px] ${styles}`}
    >
      <Icon size={20} strokeWidth={1.75} className="flex-shrink-0" aria-hidden />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificação"
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}
