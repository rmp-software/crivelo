'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@crivelo/ui/page-header';
import EventForm from '@/app/components/EventForm';
import { Spinner } from '@crivelo/ui/spinner';

interface EventData {
  id: string;
  name: string;
  date: string;
  location: string | null;
  description: string | null;
  judgesCount: number;
  crowdVoteEnabled: boolean;
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
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="mt-4 text-fg-2">Carregando evento...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-6 rounded-lg bg-danger-soft border border-danger text-danger">
          <h3 className="font-semibold mb-2">Erro</h3>
          <p>{error || 'Event not found'}</p>
        </div>
      </div>
    );
  }

  if (event.status !== 'setup') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-6 rounded-lg bg-danger-soft border border-danger text-danger">
          <h3 className="font-semibold mb-2">Não permitido</h3>
          <p>Este evento não pode ser editado porque não está em modo de configuração.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Editar evento"
        description={`Editar detalhes de ${event.name}`}
      />

      <div className="bg-surface-raised rounded-lg p-6 md:p-8 border border-border shadow-1">
        <EventForm
          mode="edit"
          eventId={eventId}
          initialData={{
            name: event.name,
            date: event.date,
            location: event.location || '',
            description: event.description || '',
            judgesCount: event.judgesCount,
            crowdVoteEnabled: event.crowdVoteEnabled,
          }}
        />
      </div>
    </div>
  );
}
