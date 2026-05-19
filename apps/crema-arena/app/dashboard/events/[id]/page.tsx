'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import Button from '@/app/components/Button';
import Badge from '@/app/components/Badge';
import Modal from '@/app/components/Modal';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import CompetitorPoolList from '@/app/components/CompetitorPoolList';
import { Calendar, MapPin, Users, Edit2, UserPlus, Trash2, FileText } from 'lucide-react';

interface EventData {
  id: string;
  name: string;
  date: string;
  location: string | null;
  description: string | null;
  judgesCount: number;
  status: 'setup' | 'running' | 'finished';
  bracketSize: number | null;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Competitor {
  entryId: string;
  id: string;
  name: string;
  coffeeShop: string;
  photoUrl: string;
  seed: number | null;
  status: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [addModal, setAddModal] = useState(false);
  const [removeModal, setRemoveModal] = useState<{ isOpen: boolean; competitor: Competitor | null }>({
    isOpen: false,
    competitor: null,
  });
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchEventDetails = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${eventId}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to view event details');
        }
        if (response.status === 404) {
          throw new Error('Event not found');
        }
        throw new Error('Failed to fetch event details');
      }

      const data = await response.json();
      setEvent(data.event);
      setCompetitors(data.competitors || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const handleAddCompetitor = async (competitorId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ competitor_id: competitorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add competitor');
      }

      // Refresh event details
      await fetchEventDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to add competitor to event');
      throw err;
    }
  };

  const handleRemoveCompetitor = async () => {
    if (!removeModal.competitor) return;

    setIsRemoving(true);

    try {
      const response = await fetch(
        `/api/events/${eventId}/entries/${removeModal.competitor.entryId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove competitor');
      }

      // Refresh event details
      await fetchEventDetails();
      setRemoveModal({ isOpen: false, competitor: null });
    } catch (err: any) {
      alert(err.message || 'Failed to remove competitor from event');
    } finally {
      setIsRemoving(false);
    }
  };

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

  const registeredCompetitorIds = competitors.map((c) => c.id);
  const canModify = event.status === 'setup';

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={event.name}
        description={`Evento ${event.status === 'setup' ? 'em configuração' : event.status === 'running' ? 'ao vivo' : 'encerrado'}`}
        actions={
          canModify && (
            <Button
              variant="secondary"
              onClick={() => router.push(`/dashboard/events/${eventId}/edit`)}
            >
              <Edit2 size={20} />
              Editar Evento
            </Button>
          )
        }
      />

      {/* Event Info Card */}
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)] mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[var(--fg)] font-[family-name:var(--font-display)] mb-2">
              {event.name}
            </h2>
            {getStatusBadge(event.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 text-[var(--fg-2)]">
            <Calendar size={20} className="text-[var(--fg-3)]" />
            <span>{formatDate(event.date)}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-3 text-[var(--fg-2)]">
              <MapPin size={20} className="text-[var(--fg-3)]" />
              <span>{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-[var(--fg-2)]">
            <Users size={20} className="text-[var(--fg-3)]" />
            <span>{event.judgesCount} {event.judgesCount === 1 ? 'juiz' : 'juízes'}</span>
          </div>

          <div className="flex items-center gap-3 text-[var(--fg-2)]">
            <Users size={20} className="text-[var(--fg-3)]" />
            <span>{competitors.length} {competitors.length === 1 ? 'competidor inscrito' : 'competidores inscritos'}</span>
          </div>
        </div>

        {event.description && (
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex items-start gap-3">
              <FileText size={20} className="text-[var(--fg-3)] mt-0.5" />
              <p className="text-[var(--fg-2)] whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Registered Competitors Section */}
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-[var(--fg)] font-[family-name:var(--font-display)]">
              Competidores Inscritos
            </h3>
            <p className="text-sm text-[var(--fg-3)] mt-1">
              {competitors.length} {competitors.length === 1 ? 'competidor' : 'competidores'}
            </p>
          </div>

          {canModify && (
            <Button
              variant="primary"
              onClick={() => setAddModal(true)}
            >
              <UserPlus size={20} />
              Adicionar
            </Button>
          )}
        </div>

        {/* Competitors List */}
        {competitors.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg)] rounded-[var(--radius-md)] border border-[var(--border)]">
            <p className="text-[var(--fg-2)] mb-2">Nenhum competidor inscrito ainda</p>
            <p className="text-sm text-[var(--fg-3)] mb-6">
              Adicione competidores do seu pool global
            </p>
            {canModify && (
              <Button variant="primary" onClick={() => setAddModal(true)}>
                <UserPlus size={20} />
                Adicionar Competidor
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {competitors.map((competitor) => (
              <div
                key={competitor.entryId}
                className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)]"
              >
                {/* Photo */}
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
                  <img
                    src={competitor.photoUrl}
                    alt={competitor.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[var(--fg)] truncate">
                    {competitor.name}
                  </h4>
                  <p className="text-sm text-[var(--fg-2)] truncate">
                    {competitor.coffeeShop}
                  </p>
                  {competitor.seed && (
                    <p className="text-xs text-[var(--fg-3)] mt-1">
                      Seed: {competitor.seed}
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                {canModify && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemoveModal({ isOpen: true, competitor })}
                  >
                    <Trash2 size={16} />
                    Remover
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Competitor Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Adicionar Competidores"
      >
        <CompetitorPoolList
          eventId={eventId}
          registeredCompetitorIds={registeredCompetitorIds}
          onAddCompetitor={handleAddCompetitor}
        />
      </Modal>

      {/* Remove Competitor Confirmation Modal */}
      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, competitor: null })}
        onConfirm={handleRemoveCompetitor}
        title="Remover Competidor"
        message={`Tem certeza que deseja remover ${removeModal.competitor?.name} deste evento?`}
        confirmText="Remover"
        isDanger
        isLoading={isRemoving}
      />
    </div>
  );
}
