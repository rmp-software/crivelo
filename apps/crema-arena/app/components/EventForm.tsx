'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from './Button';
import Input from './Input';

interface EventFormProps {
  eventId?: string;
  initialData?: {
    name: string;
    date: string;
    location?: string;
    description?: string;
    judgesCount: number;
  };
  mode: 'create' | 'edit';
}

export default function EventForm({ eventId, initialData, mode }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    date: initialData?.date || '',
    location: initialData?.location || '',
    description: initialData?.description || '',
    judges_count: initialData?.judgesCount || 3,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Event name must be at least 3 characters';
    }

    // Validate date
    if (!formData.date) {
      newErrors.date = 'Event date is required';
    } else {
      const eventDate = new Date(formData.date);
      const now = new Date();

      if (isNaN(eventDate.getTime())) {
        newErrors.date = 'Invalid date format';
      } else if (mode === 'create' && eventDate < now) {
        newErrors.date = 'Event date must be in the future';
      }
    }

    // Validate judges count
    const judgesCount = parseInt(formData.judges_count.toString(), 10);
    if (isNaN(judgesCount) || judgesCount < 1 || judgesCount > 10) {
      newErrors.judges_count = 'Judges count must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = mode === 'create' ? '/api/events' : `/api/events/${eventId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode} event`);
      }

      // Redirect to events list or detail page
      if (mode === 'create') {
        router.push(`/dashboard/events/${data.id}`);
      } else {
        router.push(`/dashboard/events/${eventId}`);
      }
    } catch (err: any) {
      setError(err.message || `An error occurred while ${mode === 'create' ? 'creating' : 'updating'} the event`);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'edit' && eventId) {
      router.push(`/dashboard/events/${eventId}`);
    } else {
      router.push('/dashboard/events');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* Name Input */}
      <Input
        label="Nome do evento"
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
        fullWidth
        placeholder="Ex.: TNT Vila Madá 2026"
      />

      {/* Date Input */}
      <Input
        label="Data do evento"
        type="datetime-local"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        error={errors.date}
        required
        fullWidth
      />

      {/* Location Input */}
      <Input
        label="Local"
        type="text"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        fullWidth
        placeholder="Ex.: Coffee Lab · Vila Madalena"
        helperText="Opcional"
      />

      {/* Description Textarea */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-[var(--fg-2)] mb-1.5"
        >
          Descrição
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1 focus:border-[var(--brand)] bg-[var(--surface)] text-[var(--fg)] transition-all"
          placeholder="Detalhes do evento..."
          style={{ transitionDuration: 'var(--dur-base)', transitionTimingFunction: 'var(--ease-standard)' }}
        />
        <p className="mt-1.5 text-sm text-[var(--fg-3)]">Opcional</p>
      </div>

      {/* Judges Count Input */}
      <Input
        label="Número de jurados"
        type="number"
        min="1"
        max="10"
        value={formData.judges_count}
        onChange={(e) => setFormData({ ...formData, judges_count: parseInt(e.target.value, 10) || 1 })}
        error={errors.judges_count}
        required
        fullWidth
        helperText="Entre 1 e 10 jurados"
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (mode === 'create' ? 'Criando...' : 'Salvando...') : (mode === 'create' ? 'Criar evento' : 'Salvar alterações')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
