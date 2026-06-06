'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from './Button';
import Input from './Input';
import DateTime24h from './DateTime24h';

interface EventFormProps {
  eventId?: string;
  initialData?: {
    name: string;
    date: string;
    location?: string;
    description?: string;
    judgesCount: number;
    crowdVoteEnabled?: boolean;
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
    // Default on for new events; preserve the saved value when editing.
    crowd_vote_enabled: initialData?.crowdVoteEnabled ?? true,
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
      // NOTE: this form sends the FULL event payload. In `mode='edit'` it must
      // only ever be rendered for an event in `setup` (the edit page walls off
      // non-setup events client-side). Running-event edits — i.e. flipping
      // crowd_vote_enabled live — are owned by RunningEventPanel, which sends
      // only the toggle field; the events API also ignores the setup-only fields
      // when the event is running. Do not reuse this form for running events.
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

      {/* Date + 24h time (locale-independent) */}
      <DateTime24h
        label="Data do evento"
        value={formData.date}
        onChange={(date) => setFormData({ ...formData, date })}
        error={errors.date}
        required
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

      {/* Crowd vote toggle */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="crowd_vote_enabled"
            className="block text-sm font-medium text-[var(--fg-2)]"
          >
            Voto do público
          </label>
          <button
            type="button"
            role="switch"
            id="crowd_vote_enabled"
            aria-checked={formData.crowd_vote_enabled}
            onClick={() =>
              setFormData({ ...formData, crowd_vote_enabled: !formData.crowd_vote_enabled })
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1 ${
              formData.crowd_vote_enabled ? 'bg-[var(--brand)]' : 'bg-[var(--border-strong)]'
            }`}
            style={{ transitionDuration: 'var(--dur-base)', transitionTimingFunction: 'var(--ease-standard)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-[var(--surface-raised)] shadow transition-transform ${
                formData.crowd_vote_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
              style={{ transitionDuration: 'var(--dur-base)', transitionTimingFunction: 'var(--ease-standard)' }}
            />
          </button>
        </div>
        <p className="mt-1.5 text-sm text-[var(--fg-3)]">
          O público vota pelo celular, sem afetar o resultado dos jurados.
        </p>
      </div>

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
