'use client';

import { useState, useRef, useEffect } from 'react';
import Button from './Button';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import WildcardModal from './WildcardModal';
import { useToast } from './Toast';
import { Camera, Trophy, Upload, User } from 'lucide-react';

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
}

interface TapToTallyProps {
  duel: Duel;
  judgesCount: number;
  onRefresh: () => void;
}

export default function TapToTally({ duel, judgesCount, onRefresh }: TapToTallyProps) {
  const { showToast } = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showWildcardModal, setShowWildcardModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local optimistic vote overlay: increments instantly on tap; reconciled when
  // the parent's refresh comes back with the authoritative server state.
  const [optimisticA, setOptimisticA] = useState(duel.votesA);
  const [optimisticB, setOptimisticB] = useState(duel.votesB);
  useEffect(() => {
    setOptimisticA(duel.votesA);
    setOptimisticB(duel.votesB);
  }, [duel.id, duel.votesA, duel.votesB]);

  const votesA = optimisticA;
  const votesB = optimisticB;
  const totalVotes = votesA + votesB;
  const computedWinnerId = votesA >= votesB ? duel.entryA?.id : duel.entryB?.id;
  const computedWinnerName = votesA >= votesB
    ? duel.entryA?.competitor.name
    : duel.entryB?.competitor.name;
  const scoreDisplay = `${Math.max(votesA, votesB)} × ${Math.min(votesA, votesB)}`;

  const handleStartDuel = async () => {
    setIsStarting(true);
    try {
      const response = await fetch(`/api/duels/${duel.id}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start duel');
      }

      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Não foi possível iniciar o duelo', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  const handleVote = async (cup: 'A' | 'B') => {
    // Optimistic: increment immediately so rapid taps register without freeze.
    if (cup === 'A') setOptimisticA((v) => v + 1);
    else setOptimisticB((v) => v + 1);

    try {
      const response = await fetch(`/api/duels/${duel.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cup }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record vote');
      }

      // Quietly refresh in the background to sync the server state.
      onRefresh();
    } catch (err: any) {
      // Roll back this optimistic tick.
      if (cup === 'A') setOptimisticA((v) => Math.max(0, v - 1));
      else setOptimisticB((v) => Math.max(0, v - 1));
      showToast(err.message || 'Não foi possível registrar o voto', 'error');
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`/api/duels/${duel.id}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload photo');
      }

      showToast('Foto enviada.', 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Não foi possível enviar a foto', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCompleteDuel = async () => {
    if (!computedWinnerId) return;

    setIsCompleting(true);
    try {
      const response = await fetch(`/api/duels/${duel.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winner_entry_id: computedWinnerId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete duel');
      }

      setShowCompleteModal(false);
      showToast(`${scoreDisplay} para ${computedWinnerName}. Vencedor avança.`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Não foi possível encerrar o duelo', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  if (duel.status === 'pending') {
    // Check if one of the slots is empty (BYE situation)
    const hasEmptySlot = !duel.entryA || !duel.entryB;

    return (
      <>
        <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-[var(--fg)] mb-4 font-[family-name:var(--font-display)]">
              Duelo {duel.position + 1} - Pronto para começar
            </h3>
            <p className="text-[var(--fg-2)] mb-6">
              {hasEmptySlot
                ? 'Este duelo tem uma vaga vazia. Você pode adicionar um wildcard ou fazer um W.O.'
                : 'Clique para iniciar o duelo, ou substitua um competidor com wildcard.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowWildcardModal(true)}
              >
                <User size={20} />
                {hasEmptySlot ? 'Adicionar wildcard' : 'Substituir com wildcard'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartDuel}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Trophy size={20} />
                    {hasEmptySlot ? 'Iniciar (W.O.)' : 'Iniciar duelo'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <WildcardModal
          isOpen={showWildcardModal}
          onClose={() => setShowWildcardModal(false)}
          duelId={duel.id}
          onSuccess={onRefresh}
          entryA={duel.entryA}
          entryB={duel.entryB}
        />
      </>
    );
  }

  if (duel.status === 'completed') {
    return (
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <div className="text-center py-8">
          <Trophy size={48} className="mx-auto text-[var(--success)] mb-4" />
          <h3 className="text-xl font-semibold text-[var(--fg)] mb-2 font-[family-name:var(--font-display)]">
            Duelo concluído
          </h3>
          <p className="text-[var(--fg-2)]">
            Este duelo já foi finalizado
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-[var(--fg)] font-[family-name:var(--font-display)]">
            Duelo {duel.position + 1} - Rodada {duel.round}
          </h3>
          <p className="text-sm text-[var(--fg-3)] mt-1">
            Toque nos copos para registrar votos
          </p>
        </div>

        {/* Photo Upload Section */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {duel.pourPhotoUrl ? (
            <div className="relative rounded-[var(--radius-md)] overflow-hidden">
              <img
                src={duel.pourPhotoUrl}
                alt="Pour photo"
                className="w-full h-64 object-cover"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute top-3 right-3"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--fg)] border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Refotografar
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[var(--fg)] border-t-transparent rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Camera size={20} />
                  Fotografar copos
                </>
              )}
            </Button>
          )}
        </div>

        {/* Vote buttons — competitor name is the primary label */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
          {duel.entryA && (
            <VoteButton
              competitor={duel.entryA.competitor}
              side="A"
              votes={votesA}
              disabled={false}
              onClick={() => handleVote('A')}
            />
          )}
          {duel.entryB && (
            <VoteButton
              competitor={duel.entryB.competitor}
              side="B"
              votes={votesB}
              disabled={false}
              onClick={() => handleVote('B')}
            />
          )}
        </div>

        {/* Complete Duel Button */}
        <div className="pt-6 border-t border-[var(--border)]">
          {totalVotes < judgesCount && (
            <p className="text-center text-sm text-[var(--fg-3)] mb-3">
              Faltam {judgesCount - totalVotes} {judgesCount - totalVotes === 1 ? 'voto' : 'votos'}
            </p>
          )}
          <Button
            variant="primary"
            onClick={() => setShowCompleteModal(true)}
            disabled={totalVotes < judgesCount}
            className="w-full"
          >
            <Trophy size={20} />
            Encerrar duelo
          </Button>
        </div>
      </div>

      {/* Complete Duel Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Encerrar duelo"
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <p className="text-3xl font-mono font-bold text-[var(--fg)] mb-2">
              {scoreDisplay}
            </p>
            <p className="text-lg text-[var(--fg-2)]">
              para <span className="font-semibold text-[var(--fg)]">{computedWinnerName}</span>
            </p>
            <p className="text-sm text-[var(--fg-3)] mt-3">
              Confirmar resultado e avançar para a próxima rodada?
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowCompleteModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCompleteDuel}
              disabled={isCompleting}
              className="flex-1"
            >
              {isCompleting ? (
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
    </>
  );
}

function VoteButton({
  competitor,
  side,
  votes,
  disabled,
  onClick,
}: {
  competitor: Competitor;
  side: 'A' | 'B';
  votes: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Votar em ${competitor.name} (Copa ${side})`}
      className="group relative w-full text-left rounded-[var(--radius-lg)] border-2 border-[var(--border-strong)] bg-[var(--surface-raised)] p-4 md:p-5 transition-all duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
          <img
            src={competitor.photoUrl}
            alt=""
            aria-hidden
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--fg-3)]">
            Copa {side}
          </p>
          <h4 className="text-xl md:text-2xl font-display font-bold text-[var(--fg)] leading-tight mt-0.5 line-clamp-2">
            {competitor.name}
          </h4>
          <p className="text-sm font-serif italic text-[var(--fg-2)] mt-1 line-clamp-1">
            {competitor.coffeeShop}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[64px] text-right">
          <span className="block font-mono text-4xl md:text-5xl font-semibold tabular-nums text-[var(--fg)]">
            {votes}
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--fg-3)] mt-0.5">
            {votes === 1 ? 'voto' : 'votos'}
          </span>
        </div>
      </div>
    </button>
  );
}
