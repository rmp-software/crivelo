'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@crivelo/ui/alert-dialog';
import { Button } from '@crivelo/ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

/**
 * Arena ConfirmationModal — thin wrapper over the shared shadcn AlertDialog
 * (`@crivelo/ui/alert-dialog`).
 *
 * RMP-205: maps the legacy product API ({ isOpen, onClose, onConfirm, title, message,
 * confirmText, isDanger, isLoading }) onto the shared primitive so every destructive-
 * confirm call site keeps its props.
 *
 * Visibility is parent-controlled: `open={isOpen}` is the SOLE source of truth. The
 * confirm action is a plain `<Button>` (NOT AlertDialogAction, which would call Radix's
 * onOpenChange(false) synchronously on click and auto-close the dialog before the async
 * onConfirm resolves). Instead the parent closes the dialog (isOpen=false) on success and
 * leaves it OPEN on error, and "Processando..." renders while isLoading. isDanger →
 * destructive variant, isLoading → disabled. pt-BR strings ("Cancelar", "Processando...",
 * default "Confirmar") are the only user-facing text.
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => {
          if (isLoading) e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <Button
            variant={isDanger ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processando...' : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
