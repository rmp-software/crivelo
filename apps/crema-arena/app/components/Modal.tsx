'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-labelledby="modal-title"
      aria-modal="true"
      role="dialog"
      style={{ backgroundColor: 'rgba(31,20,16,0.55)' }}
    >
      <div
        className={`relative bg-[var(--surface-raised)] rounded-[var(--radius-lg)] shadow-[var(--shadow-2)] w-full ${sizeStyles[size]} max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transitionTimingFunction: 'var(--ease-overshoot)',
          border: '1.5px solid var(--espresso-900)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 id="modal-title" className="text-xl font-display font-bold text-[var(--fg)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-xs)] text-[var(--fg-3)] hover:text-[var(--fg)] hover:bg-[var(--bg-2)] transition-colors"
            aria-label="Close modal"
            style={{ transitionDuration: 'var(--dur-base)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
