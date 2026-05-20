'use client';

import { useState } from 'react';
import useSWR from 'swr';
import TapToTally from './TapToTally';
import Badge from './Badge';
import Button from './Button';
import Modal from './Modal';
import { CheckCircle, Circle, Play, RotateCcw, SkipForward, Trophy } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  photoUrl: string;
  coffeeShop: string;
}

interface Entry {
  id: string;
  competitor: Competitor;
}

interface Duel {
  id: string;
  round: number;
  position: number;
  status: 'pending' | 'in_progress' | 'completed' | 'walkover';
  votesA: number;
  votesB: number;
  pourPhotoUrl: string | null;
  entryA: Entry | null;
  entryB: Entry | null;
  winner?: Entry | null;
  isBronzeMatch?: boolean;
  deferredAt?: string | null;
}

interface RunningEventPanelProps {
  eventId: string;
  onEventFinished?: () => void;
}

const runningFetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to fetch running event data'))));

export default function RunningEventPanel({ eventId, onEventFinished }: RunningEventPanelProps) {
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const { data, mutate: fetchRunningData } = useSWR(
    `/api/events/${eventId}/running`,
    runningFetcher,
    { refreshInterval: 5000, revalidateOnFocus: false }
  );

  const currentRound = data?.currentRound ?? 1;
  const totalRounds = data?.totalRounds ?? 1;
  const judgesCount = data?.judgesCount ?? 3;
  const activeDuel: Duel | null = data?.activeDuel ?? null;
  const duels: Duel[] = data?.duels ?? [];
  const allDuelsCompleted: boolean = data?.allDuelsCompleted ?? false;
  const isLoading = !data;

  // Defer / resume now live on the server (Duel.deferred_at) so the Live Display
  // and companion follow the organizer's skip decisions in real time.
  const handleSkipDuel = async (id: string) => {
    try {
      const r = await fetch(`/api/duels/${id}/defer`, { method: 'POST' });
      if (!r.ok) throw new Error((await r.json()).error || 'Falha ao adiar duelo');
      await fetchRunningData();
    } catch (err) {
      console.error(err);
    }
  };
  const handleResumeDuel = async (id: string) => {
    try {
      const r = await fetch(`/api/duels/${id}/defer`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).error || 'Falha ao retomar duelo');
      await fetchRunningData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinishEvent = async () => {
    setIsFinishing(true);
    try {
      const response = await fetch(`/api/events/${eventId}/finish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to finish event');
      }

      setShowFinishModal(false);
      if (onEventFinished) {
        onEventFinished();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsFinishing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Concluído</Badge>;
      case 'in_progress':
        return <Badge variant="default">Em andamento</Badge>;
      case 'walkover':
        return <Badge variant="warning">W.O.</Badge>;
      default:
        return <Badge variant="default">Pendente</Badge>;
    }
  };

  const getRoundName = (round: number, total: number) => {
    if (round === total) return 'Final';
    if (round === total - 1) return 'Semifinal';
    return `Rodada ${round}`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[var(--fg-2)]">Carregando dados do evento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Round Header */}
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--fg)] font-[family-name:var(--font-display)]">
              {getRoundName(currentRound, totalRounds)}
            </h2>
            <p className="text-sm text-[var(--fg-3)] mt-1">
              {duels.filter((d) => d.status === 'completed').length} de {duels.length} duelos concluídos
            </p>
          </div>
          {/* Only allow ending the event once the FINAL round is complete. */}
          {allDuelsCompleted && currentRound === totalRounds && (
            <Button
              variant="primary"
              onClick={() => setShowFinishModal(true)}
              disabled={isFinishing}
            >
              <Trophy size={20} />
              Encerrar evento
            </Button>
          )}
        </div>
      </div>

      {/* Active Duel - Tap-to-Tally */}
      {activeDuel && (
        <>
          <TapToTally duel={activeDuel} judgesCount={judgesCount} onRefresh={fetchRunningData} />
          {/* Skip-duel control: only meaningful when another pending duel exists in this round */}
          {duels.some(
            (d) =>
              d.id !== activeDuel.id &&
              (d.status === 'pending' || d.status === 'in_progress') &&
              !d.deferredAt
          ) && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSkipDuel(activeDuel.id)}
              >
                <SkipForward size={16} />
                Pular duelo
              </Button>
            </div>
          )}
        </>
      )}

      {/* Finish Event Confirmation Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Encerrar evento"
      >
        <div className="space-y-4">
          <p className="text-[var(--fg-2)]">
            Tem certeza que deseja encerrar o evento? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowFinishModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleFinishEvent}
              disabled={isFinishing}
              className="flex-1"
            >
              {isFinishing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Encerrando...
                </>
              ) : (
                <>
                  <Trophy size={20} />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Duel List */}
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <h3 className="text-xl font-semibold text-[var(--fg)] font-[family-name:var(--font-display)] mb-4">
          Todos os duelos - {getRoundName(currentRound, totalRounds)}
        </h3>

        <div className="space-y-3">
          {duels.map((duel) => (
            <div
              key={duel.id}
              className={`p-4 rounded-[var(--radius-md)] border transition-colors ${
                activeDuel?.id === duel.id
                  ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                  : 'border-[var(--border)] bg-[var(--surface)]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[var(--fg)]">
                    {duel.isBronzeMatch ? 'Disputa de 3º lugar' : `Duelo ${duel.position + 1}`}
                  </span>
                  {getStatusBadge(duel.status)}
                  {duel.deferredAt && (
                    <Badge variant="warning">Adiado</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {duel.deferredAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResumeDuel(duel.id)}
                    >
                      <RotateCcw size={14} />
                      Retomar duelo
                    </Button>
                  )}
                  {duel.status === 'in_progress' && (
                    <Play size={16} className="text-[var(--brand)] animate-pulse" />
                  )}
                  {duel.status === 'completed' && (
                    <CheckCircle size={16} className="text-[var(--success)]" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Competitor A */}
                {duel.entryA ? (
                  <div
                    className={`flex items-center gap-2 p-2 rounded-[var(--radius-sm)] ${
                      duel.winner?.id === duel.entryA.id
                        ? 'bg-[var(--success-soft)] border-2 border-[var(--success)]'
                        : 'bg-[var(--bg)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] flex-shrink-0">
                      <img
                        src={duel.entryA.competitor.photoUrl}
                        alt={duel.entryA.competitor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--fg)] truncate">
                        {duel.entryA.competitor.name}
                      </p>
                      {duel.status !== 'pending' && (
                        <p className="text-xs text-[var(--fg-3)]">
                          {duel.votesA} {duel.votesA === 1 ? 'voto' : 'votos'}
                        </p>
                      )}
                    </div>
                    {duel.winner?.id === duel.entryA.id && (
                      <Trophy size={14} className="text-[var(--success)] flex-shrink-0" />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] bg-[var(--bg)]">
                    <Circle size={20} className="text-[var(--fg-4)]" />
                    <span className="text-sm text-[var(--fg-3)]" aria-label="Sem oponente">—</span>
                  </div>
                )}

                {/* Competitor B */}
                {duel.entryB ? (
                  <div
                    className={`flex items-center gap-2 p-2 rounded-[var(--radius-sm)] ${
                      duel.winner?.id === duel.entryB.id
                        ? 'bg-[var(--success-soft)] border-2 border-[var(--success)]'
                        : 'bg-[var(--bg)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] flex-shrink-0">
                      <img
                        src={duel.entryB.competitor.photoUrl}
                        alt={duel.entryB.competitor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--fg)] truncate">
                        {duel.entryB.competitor.name}
                      </p>
                      {duel.status !== 'pending' && (
                        <p className="text-xs text-[var(--fg-3)]">
                          {duel.votesB} {duel.votesB === 1 ? 'voto' : 'votos'}
                        </p>
                      )}
                    </div>
                    {duel.winner?.id === duel.entryB.id && (
                      <Trophy size={14} className="text-[var(--success)] flex-shrink-0" />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] bg-[var(--bg)]">
                    <Circle size={20} className="text-[var(--fg-4)]" />
                    <span className="text-sm text-[var(--fg-3)]" aria-label="Sem oponente">—</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
