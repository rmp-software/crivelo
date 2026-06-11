'use client';

import { useMemo } from 'react';
import { toast } from '@crivelo/ui/sonner';

export type ToastVariant = 'success' | 'error' | 'info';

interface UseToastValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

/**
 * Arena toast hook — thin wrapper over the shared Sonner primitive
 * (`@crivelo/ui/sonner`), mounted once via `<Toaster />` in the root layout.
 *
 * RMP-205: preserves the legacy `useToast().showToast(message, variant)` API so
 * every call site keeps its signature while feedback now renders through the
 * shared Sonner queue (themed via the house tokens). Variant maps onto Sonner's
 * typed toasts; the default stays `'success'`, matching the retired hand-rolled
 * `ToastProvider`.
 */
export function useToast(): UseToastValue {
  return useMemo(
    () => ({
      showToast: (message: string, variant: ToastVariant = 'success') => {
        if (variant === 'error') {
          toast.error(message);
        } else if (variant === 'info') {
          toast.info(message);
        } else {
          toast.success(message);
        }
      },
    }),
    []
  );
}
