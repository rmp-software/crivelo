'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import EventForm from '@/app/components/EventForm';

interface EventData {
  id: string;
  name: string;
  date: string;
  location: string | null;
  description: string | null;
  judgesCount: number;
  status: string;
}

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/events/${eventId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Event not found');
          }
          throw new Error('Failed to fetch event details');
        }

        const data = await response.json();
        setEvent(data.event);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[var(--fg-2)]">Carregando evento...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          <h3 className="font-semibold mb-2">Erro</h3>
          <p>{error || 'Event not found'}</p>
        </div>
      </div>
    );
  }

  if (event.status !== 'setup') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          <h3 className="font-semibold mb-2">Não Permitido</h3>
          <p>Este evento não pode ser editado porque não está em modo de configuração.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Editar Evento"
        description={`Editar detalhes de ${event.name}`}
      />

      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <EventForm
          mode="edit"
          eventId={eventId}
          initialData={{
            name: event.name,
            date: event.date,
            location: event.location || '',
            description: event.description || '',
            judgesCount: event.judgesCount,
          }}
        />
      </div>
    </div>
  );
}
