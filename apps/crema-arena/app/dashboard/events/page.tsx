'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/app/components/PageHeader';
import Button from '@/app/components/Button';
import Badge from '@/app/components/Badge';
import EmptyState from '@/app/components/EmptyState';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Plus, Calendar, MapPin, Users, PartyPopper } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string | null;
  status: 'setup' | 'running' | 'finished';
  judgesCount: number;
  competitorCount: number;
  createdAt: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchEvents = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/events?limit=50');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to view events');
        }
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'setup':
        return <Badge variant="default">Configuração</Badge>;
      case 'running':
        return <Badge variant="success">Ao vivo</Badge>;
      case 'finished':
        return <Badge variant="warning">Encerrado</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Eventos"
        description="Gerencie seus eventos de competição"
        actions={
          <Link href="/dashboard/events/new">
            <Button variant="primary">
              <Plus size={20} />
              Novo evento
            </Button>
          </Link>
        }
      />

      {/* Error State */}
      {error && (
        <div className="p-4 mb-6 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-[var(--fg-2)]">Carregando eventos...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && events.length === 0 && (
        <EmptyState
          icon={PartyPopper}
          title="Nenhum evento ainda"
          description="Comece criando seu primeiro evento de competição"
          action={{
            label: 'Criar Primeiro Evento',
            onClick: () => router.push('/dashboard/events/new'),
          }}
        />
      )}

      {/* Events Grid */}
      {!isLoading && !error && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className="block group"
              aria-label={`Ver detalhes do evento ${event.name}`}
            >
              <div
                className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-4 md:p-6 border border-[var(--border)] hover:border-[var(--brand)] hover:shadow-[var(--shadow-2)] transition-all cursor-pointer group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-[var(--focus-ring)] group-focus-visible:outline-offset-2"
                style={{
                  transitionDuration: 'var(--dur-base)',
                  transitionTimingFunction: 'var(--ease-standard)',
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4 gap-2">
                  <h3 className="text-base md:text-lg font-semibold text-[var(--fg)] font-[family-name:var(--font-display)] leading-tight flex-1">
                    {event.name}
                  </h3>
                  {getStatusBadge(event.status)}
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-[var(--fg-2)] mb-2">
                  <Calendar size={16} className="text-[var(--fg-3)]" aria-hidden="true" />
                  <time dateTime={event.date}>{formatDate(event.date)}</time>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-[var(--fg-2)] mb-4">
                    <MapPin size={16} className="text-[var(--fg-3)]" aria-hidden="true" />
                    {event.location}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-[var(--fg-3)]" aria-hidden="true" />
                    <span className="text-[var(--fg-2)]">
                      {event.competitorCount} {event.competitorCount === 1 ? 'competidor' : 'competidores'}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--fg-3)]">
                    {event.judgesCount} {event.judgesCount === 1 ? 'juiz' : 'juízes'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
