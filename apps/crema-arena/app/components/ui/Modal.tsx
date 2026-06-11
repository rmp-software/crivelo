'use client';

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@crivelo/ui/dialog';
import { cn } from '@crivelo/ui/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Arena Modal — thin wrapper over the shared shadcn Dialog (`@crivelo/ui/dialog`).
 *
 * RMP-205: maps the legacy product API ({ isOpen, onClose, title, children, footer,
 * size }) onto the shared primitive so every call site keeps its props while rendering
 * the Radix-backed Dialog (Escape-to-close, overlay-click-close, and focus trap come
 * from Radix). The size scale reproduces the pre-migration max-widths:
 *   - sm → max-w-md, md → max-w-lg, lg → max-w-2xl
 * The close button's SR label is "Fechar" (pt-BR), the only user-facing string here.
 */
const sizeMap = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
} as const;

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        closeLabel="Fechar"
        className={cn('max-h-[90vh] overflow-y-auto', sizeMap[size])}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
