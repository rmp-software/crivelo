'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/app/components/Button';
import Badge from '@/app/components/Badge';
import Modal from '@/app/components/Modal';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import CompetitorPoolList from '@/app/components/CompetitorPoolList';
import BracketView from '@/app/components/BracketView';
import RunningEventPanel from '@/app/components/RunningEventPanel';
import { Calendar, MapPin, Users, Edit2, UserPlus, Trash2, FileText, Play, Copy, Check, Download, Link2 } from 'lucide-react';

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

interface Duel {
  id: string;
  round: number;
  position: number;
  entryA: {
    id: string;
    name: string;
    photoUrl: string;
    coffeeShop: string;
  } | null;
  entryB: {
    id: string;
    name: string;
    photoUrl: string;
    coffeeShop: string;
  } | null;
  winner: {
    id: string;
    name: string;
    photoUrl: string;
    coffeeShop: string;
  } | null;
  status: 'pending' | 'in_progress' | 'completed' | 'walkover';
  votesA: number;
  votesB: number;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [removeModal, setRemoveModal] = useState<{ isOpen: boolean; competitor: Competitor | null }>({
    isOpen: false,
    competitor: null,
  });
  const [isRemoving, setIsRemoving] = useState(false);
  const [copied, setCopied] = useState<'live' | 'audience' | null>(null);
  const [qrDownloading, setQrDownloading] = useState(false);

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
      setDuels(data.duels || []);
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

  const handleAddCompetitor = async (pool: { id: string; name: string; coffeeShop: string; photoUrl: string }) => {
    // Optimistic insert — show in the inscribed list immediately, keep modal open.
    const tempEntryId = `temp-${pool.id}-${Date.now()}`;
    const optimistic: Competitor = {
      entryId: tempEntryId,
      id: pool.id,
      name: pool.name,
      coffeeShop: pool.coffeeShop,
      photoUrl: pool.photoUrl,
      seed: null,
      status: 'active',
    };
    setCompetitors((prev) => [...prev, optimistic]);

    try {
      const response = await fetch(`/api/events/${eventId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_id: pool.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao inscrever competidor');
      }

      const entry = await response.json();
      // Replace the optimistic placeholder with the server-provided entryId.
      setCompetitors((prev) =>
        prev.map((c) =>
          c.entryId === tempEntryId
            ? { ...c, entryId: entry.entryId, seed: entry.seed ?? null, status: entry.status ?? 'active' }
            : c
        )
      );
    } catch (err: any) {
      // Roll back the optimistic insert and surface the error.
      setCompetitors((prev) => prev.filter((c) => c.entryId !== tempEntryId));
      alert(err.message || 'Falha ao inscrever competidor');
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

  const handleGenerateBracket = async () => {
    setIsGeneratingBracket(true);
    try {
      const response = await fetch(`/api/events/${eventId}/bracket`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate bracket');
      }

      await fetchEventDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to generate bracket');
    } finally {
      setIsGeneratingBracket(false);
    }
  };

  const handleStartEvent = async () => {
    setIsStarting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start event');
      }

      setShowStartModal(false);
      await fetchEventDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to start event');
    } finally {
      setIsStarting(false);
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

  const handleCopy = async (which: 'live' | 'audience') => {
    const path = which === 'live' ? `/live/${eventId}` : `/e/${eventId}`;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      alert('Falha ao copiar URL');
    }
  };

  const handleDownloadQr = async () => {
    setQrDownloading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/qr`);
      if (!response.ok) throw new Error('Failed to fetch QR code');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download QR code:', err);
      alert('Falha ao baixar QR code');
    } finally {
      setQrDownloading(false);
    }
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
      {/* Event Info Card — primary header; replaces the stacked PageHeader */}
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)] mb-6">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-[var(--fg)] font-[family-name:var(--font-display)] mb-2">
              {event.name}
            </h1>
            {getStatusBadge(event.status)}
          </div>
          {canModify && (
            <Button
              variant="secondary"
              onClick={() => router.push(`/dashboard/events/${eventId}/edit`)}
            >
              <Edit2 size={20} />
              Editar evento
            </Button>
          )}
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

      {/* Step 1: Generate Bracket */}
      {event.status === 'setup' && competitors.length >= 2 && duels.length === 0 && (
        <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 border border-[var(--border)] shadow-[var(--shadow-1)] mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--fg)] font-[family-name:var(--font-display)]">
                Gerar chave
              </h3>
              <p className="text-sm text-[var(--fg-3)] mt-1">
                Monte a chave de eliminação com {competitors.length} competidores
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleGenerateBracket}
              disabled={isGeneratingBracket}
            >
              {isGeneratingBracket ? (
                <>
                  <div className="w-5 h-5 border-2 border-[var(--fg)] border-t-transparent rounded-full animate-spin"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Gerar chave
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review Bracket & Start */}
      {event.status === 'setup' && duels.length > 0 && (
        <>
          <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)] mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--fg)] font-[family-name:var(--font-display)]">
                Chave gerada
              </h3>
              <Button
                variant="primary"
                onClick={() => setShowStartModal(true)}
                disabled={isStarting}
              >
                <Play size={20} />
                Iniciar evento
              </Button>
            </div>
            <BracketView duels={duels} bracketSize={event.bracketSize ?? competitors.length} />
          </div>

          <Modal
            isOpen={showStartModal}
            onClose={() => setShowStartModal(false)}
            title="Iniciar evento"
          >
            <div className="space-y-4">
              <p className="text-[var(--fg-2)]">
                Tem certeza? Após iniciar o evento, não será possível alterar as inscrições.
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowStartModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStartEvent}
                  disabled={isStarting}
                  className="flex-1"
                >
                  {isStarting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}

      {/* Running Event Panel - Show when event is running */}
      {event.status === 'running' && (
        <RunningEventPanel eventId={eventId} onEventFinished={fetchEventDetails} />
      )}

      {/* Links Section - Show when event is running or finished */}
      {(event.status === 'running' || event.status === 'finished') && (
        <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)] mb-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-[var(--fg)] font-[family-name:var(--font-display)] flex items-center gap-2">
              <Link2 size={24} />
              Links
            </h3>
            <p className="text-sm text-[var(--fg-3)] mt-1">
              Compartilhe o display ao vivo e o QR code com o público
            </p>
          </div>

          <div className="space-y-6">
            {/* Live Display URL */}
            <div>
              <label className="block text-sm font-medium text-[var(--fg-2)] mb-2">
                Display ao vivo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/live/${eventId}`}
                  className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg)] font-mono text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleCopy('live')}
                  className="flex-shrink-0"
                >
                  {copied === 'live' ? (
                    <>
                      <Check size={20} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copiar URL
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-[var(--fg-3)] mt-2">
                URL para exibir ao vivo em telas grandes ou projetores
              </p>
            </div>

            {/* Audience URL */}
            <div>
              <label className="block text-sm font-medium text-[var(--fg-2)] mb-2">
                Link da plateia
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${eventId}`}
                  className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg)] font-mono text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleCopy('audience')}
                  className="flex-shrink-0"
                >
                  {copied === 'audience' ? (
                    <>
                      <Check size={20} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copiar URL
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-[var(--fg-3)] mt-2">
                URL mobile-first para a plateia acompanhar pelo celular
              </p>
            </div>

            {/* QR Code Section */}
            <div>
              <label className="block text-sm font-medium text-[var(--fg-2)] mb-2">
                QR para audiência
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="bg-white p-4 rounded-[var(--radius-md)] border-2 border-[var(--border)]">
                  <img
                    src={`/api/events/${eventId}/qr`}
                    alt="QR Code para acesso ao vivo"
                    className="w-48 h-48 sm:w-32 sm:h-32"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--fg-2)] mb-3">
                    Escaneie este QR code para acessar o display ao vivo no celular
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleDownloadQr}
                    disabled={qrDownloading}
                  >
                    {qrDownloading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Baixando...
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        Download QR
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bracket View - Show when event is running or finished */}
      {(event.status === 'running' || event.status === 'finished') && duels.length > 0 && (
        <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)] mb-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-[var(--fg)] font-[family-name:var(--font-display)]">
              Chaveamento
            </h3>
            <p className="text-sm text-[var(--fg-3)] mt-1">
              {event.bracketSize} posições • {Math.log2(event.bracketSize!)} rodadas
            </p>
          </div>
          <BracketView duels={duels} bracketSize={event.bracketSize!} />
        </div>
      )}

      {/* Registered Competitors Section */}
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-[var(--fg)] font-[family-name:var(--font-display)]">
              Competidores inscritos
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
                Adicionar competidor
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
        title="Adicionar competidores"
      >
        <CompetitorPoolList
          registeredCompetitorIds={registeredCompetitorIds}
          onAddCompetitor={handleAddCompetitor}
        />
      </Modal>

      {/* Remove Competitor Confirmation Modal */}
      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, competitor: null })}
        onConfirm={handleRemoveCompetitor}
        title="Remover competidor"
        message={`Tem certeza que deseja remover ${removeModal.competitor?.name} deste evento?`}
        confirmText="Remover"
        isDanger
        isLoading={isRemoving}
      />
    </div>
  );
}
