'use client';

import { useState, FormEvent } from 'react';
import Input from './Input';
import Button from './Button';

export interface OrganizerFormData {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'organizer';
}

interface OrganizerFormProps {
  initialData?: Partial<OrganizerFormData>;
  onSubmit: (data: OrganizerFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function OrganizerForm({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false,
}: OrganizerFormProps) {
  const [formData, setFormData] = useState<OrganizerFormData>({
    name: initialData.name || '',
    email: initialData.email || '',
    password: '',
    role: initialData.role || 'organizer',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OrganizerFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof OrganizerFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!isEdit && !formData.password) {
      newErrors.password = 'Senha obrigatória';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (error: any) {
      setServerError(error.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          {serverError}
        </div>
      )}

      <Input
        label="Nome"
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
        fullWidth
        disabled={isLoading}
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        required
        fullWidth
        disabled={isLoading}
      />

      <Input
        label="Senha"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        required={!isEdit}
        helperText={isEdit ? 'Deixe em branco para manter a senha atual' : 'Mínimo de 8 caracteres'}
        fullWidth
        disabled={isLoading}
      />

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-[var(--fg-2)] mb-1.5">
          Função <span className="text-[var(--danger)] ml-1">*</span>
        </label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'organizer' })}
          className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1 focus:border-[var(--brand)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ transitionDuration: 'var(--dur-base)', transitionTimingFunction: 'var(--ease-standard)' }}
          disabled={isLoading}
          required
        >
          <option value="organizer">Organizador</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : isEdit ? 'Atualizar organizador' : 'Criar organizador'}
        </Button>
      </div>
    </form>
  );
}
