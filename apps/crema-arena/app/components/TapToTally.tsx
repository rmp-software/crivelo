'use client';

import { useState, useRef, useEffect } from 'react';
import Button from './Button';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import WildcardModal from './WildcardModal';
import { useToast } from './Toast';
import { Camera, RefreshCw, Trophy, Upload, User } from 'lucide-react';

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
  photoLeftSlot?: 'a' | 'b' | null;
  entryA: Entry | null;
  entryB: Entry | null;
}

interface TapToTallyProps {
  duel: Duel;
  judgesCount: number;
  crowdVoteEnabled: boolean;
  onRefresh: () => void;
}

export default function TapToTally({ duel, judgesCount, crowdVoteEnabled, onRefresh }: TapToTallyProps) {
  const { showToast } = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showWildcardModal, setShowWildcardModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo-orientation capture step. After a file is chosen we hold it here and,
  // when crowd vote is on, show a confirm screen binding the LEFT cup to a
  // competitor (`captureLeftSlot`). When crowd vote is off we skip the confirm
  // and upload immediately with the default "a".
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [captureLeftSlot, setCaptureLeftSlot] = useState<'a' | 'b'>('a');
  const [isFlippingSides, setIsFlippingSides] = useState(false);

  // The persisted orientation for this duel (defaults to "a"); drives the
  // current label positions and the "Trocar lados" target after a photo exists.
  const photoLeftSlot: 'a' | 'b' = duel.photoLeftSlot === 'b' ? 'b' : 'a';

  // Local optimistic vote overlay: increments instantly on tap; reconciled when
  // the parent's refresh comes back with the authoritative server state.
  const [optimisticA, setOptimisticA] = useState(duel.votesA);
  const [optimisticB, setOptimisticB] = useState(duel.votesB);
  useEffect(() => {
    setOptimisticA(duel.votesA);
    setOptimisticB(duel.votesB);
  }, [duel.id, duel.votesA, duel.votesB]);

  // Drop any in-flight capture preview when the active duel changes, and revoke
  // the object URL so we don't leak blobs.
  useEffect(() => {
    setPendingPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, [duel.id]);
  useEffect(() => {
    return () => {
      if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.previewUrl);
    };
  }, [pendingPhoto]);

  const votesA = optimisticA;
  const votesB = optimisticB;
  const totalVotes = votesA + votesB;
  const computedWinnerId = votesA >= votesB ? duel.entryA?.id : duel.entryB?.id;
  const computedWinnerName = votesA >= votesB
    ? duel.entryA?.competitor.name
    : duel.entryB?.competitor.name;
  const scoreDisplay = `${Math.max(votesA, votesB)} × ${Math.min(votesA, votesB)}`;

  // Competitor names for the orientation step / labels.
  const entryAName = duel.entryA?.competitor.name ?? 'Competidor A';
  const entryBName = duel.entryB?.competitor.name ?? 'Competidor B';
  // Prompt always asks for competitor A's cup, regardless of which side it's on.
  const captureCupAName = entryAName;
  // Which competitor is the left cup given the persisted orientation.
  const leftCupName = photoLeftSlot === 'a' ? entryAName : entryBName;

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

  const handleUndoVote = async (cup: 'A' | 'B') => {
    if (cup === 'A' && optimisticA <= 0) {
      showToast('Sem votos para remover desse lado.', 'error');
      return;
    }
    if (cup === 'B' && optimisticB <= 0) {
      showToast('Sem votos para remover desse lado.', 'error');
      return;
    }
    // Optimistic decrement
    if (cup === 'A') setOptimisticA((v) => Math.max(0, v - 1));
    else setOptimisticB((v) => Math.max(0, v - 1));

    try {
      const response = await fetch(`/api/duels/${duel.id}/vote/last?cup=${cup}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove vote');
      }
      onRefresh();
    } catch (err: any) {
      // Roll back
      if (cup === 'A') setOptimisticA((v) => v + 1);
      else setOptimisticB((v) => v + 1);
      showToast(err.message || 'Não foi possível remover o voto', 'error');
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

  // File chosen from the picker. When crowd vote is on, hold it and show the
  // orientation confirm (required because votes bind to it). When off, upload
  // straight away with the default "a" — no friction.
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!file) return;

    if (crowdVoteEnabled) {
      // Seed the confirm step with the current orientation so a refotograph
      // keeps the previously chosen sides as the default.
      setCaptureLeftSlot(photoLeftSlot);
      setPendingPhoto((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return { file, previewUrl: URL.createObjectURL(file) };
      });
      return;
    }

    await uploadPhoto(file, 'a');
  };

  const uploadPhoto = async (file: File, leftSlot: 'a' | 'b') => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('leftSlot', leftSlot);

      const response = await fetch(`/api/duels/${duel.id}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload photo');
      }

      showToast('Foto enviada.', 'success');
      setPendingPhoto((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Não foi possível enviar a foto', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmCapture = async () => {
    if (!pendingPhoto) return;
    await uploadPhoto(pendingPhoto.file, captureLeftSlot);
  };

  const handleCancelCapture = () => {
    setPendingPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  };

  // "Trocar lados" after a photo already exists: flip orientation in place via
  // PATCH, no re-upload. Toggles relative to the persisted value.
  const handleSwapSides = async () => {
    const nextLeftSlot: 'a' | 'b' = photoLeftSlot === 'a' ? 'b' : 'a';
    setIsFlippingSides(true);
    try {
      const response = await fetch(`/api/duels/${duel.id}/photo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leftSlot: nextLeftSlot }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível trocar os lados');
      }
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Não foi possível trocar os lados', 'error');
    } finally {
      setIsFlippingSides(false);
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
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-center items-stretch sm:items-center">
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
            onChange={handleFileSelected}
            className="hidden"
          />

          {pendingPhoto ? (
            /* Orientation capture step (crowd vote on): bind the LEFT cup to a
               competitor before the photo goes live. Votes will follow this. */
            <div className="space-y-4">
              <p className="text-[var(--fg)] font-medium">
                Toque no copo de {captureCupAName}
              </p>
              <div className="relative rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)]">
                <img
                  src={pendingPhoto.previewUrl}
                  alt="Foto dos copos"
                  className="w-full h-64 object-cover"
                />
                {/* Split tap-zones: each cup labelled; the A-side highlights. */}
                <div className="absolute inset-0 grid grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCaptureLeftSlot('a')}
                    aria-pressed={captureLeftSlot === 'a'}
                    aria-label={`Copo da esquerda é de ${captureLeftSlot === 'a' ? entryAName : entryBName}`}
                    className={`relative flex flex-col justify-end p-3 text-left transition-colors ${
                      captureLeftSlot === 'a'
                        ? 'bg-[var(--brand)]/25 ring-2 ring-inset ring-[var(--brand)]'
                        : 'hover:bg-[var(--brand)]/10'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 self-start rounded-[var(--radius-xs)] bg-[var(--surface-raised)]/90 px-2 py-1 text-sm font-medium text-[var(--fg)]">
                      {captureLeftSlot === 'a' && (
                        <span aria-hidden className="text-[var(--brand)]">●</span>
                      )}
                      {captureLeftSlot === 'a' ? entryAName : entryBName}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptureLeftSlot('b')}
                    aria-pressed={captureLeftSlot === 'b'}
                    aria-label={`Copo da direita é de ${captureLeftSlot === 'a' ? entryBName : entryAName}`}
                    className={`relative flex flex-col justify-end border-l border-[var(--surface-raised)]/60 p-3 text-right transition-colors ${
                      captureLeftSlot === 'b'
                        ? 'bg-[var(--brand)]/25 ring-2 ring-inset ring-[var(--brand)]'
                        : 'hover:bg-[var(--brand)]/10'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 self-end rounded-[var(--radius-xs)] bg-[var(--surface-raised)]/90 px-2 py-1 text-sm font-medium text-[var(--fg)]">
                      {captureLeftSlot === 'b' && (
                        <span aria-hidden className="text-[var(--brand)]">●</span>
                      )}
                      {captureLeftSlot === 'b' ? entryAName : entryBName}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="ghost"
                  onClick={handleCancelCapture}
                  disabled={isUploading}
                  className="sm:flex-none"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmCapture}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[var(--fg-inverse)] border-t-transparent rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      Confirmar e enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : duel.pourPhotoUrl ? (
            <div className="space-y-3">
              <div className="relative rounded-[var(--radius-md)] overflow-hidden">
                <img
                  src={duel.pourPhotoUrl}
                  alt="Foto dos copos"
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
              {/* Orientation summary + correction without re-uploading. */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-[var(--fg-3)]">
                  Copo da esquerda: {leftCupName}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwapSides}
                  disabled={isFlippingSides}
                >
                  {isFlippingSides ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[var(--fg)] border-t-transparent rounded-full animate-spin"></div>
                      Trocando...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Trocar lados
                    </>
                  )}
                </Button>
              </div>
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

        {/* Vote buttons — competitor name is the primary label.
            Each button is fully wired to its OWN cup ('A' votes credit entry A,
            'B' votes credit entry B). Only their visual left/right ORDER follows
            photoLeftSlot so the left-positioned button matches the cup on the
            left of the pour photo. The onClick→cup mapping never changes. */}
        {(() => {
          const buttonA = duel.entryA ? (
            <div key="vote-a" className="flex flex-col gap-2">
              <VoteButton
                competitor={duel.entryA.competitor}
                side="A"
                votes={votesA}
                disabled={false}
                onClick={() => handleVote('A')}
              />
              <button
                type="button"
                onClick={() => handleUndoVote('A')}
                disabled={votesA <= 0}
                className="self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[var(--fg-3)] hover:text-[var(--fg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label={`Remover último voto de ${duel.entryA.competitor.name}`}
              >
                <span aria-hidden className="text-base leading-none">−</span> Remover voto
              </button>
            </div>
          ) : null;
          const buttonB = duel.entryB ? (
            <div key="vote-b" className="flex flex-col gap-2">
              <VoteButton
                competitor={duel.entryB.competitor}
                side="B"
                votes={votesB}
                disabled={false}
                onClick={() => handleVote('B')}
              />
              <button
                type="button"
                onClick={() => handleUndoVote('B')}
                disabled={votesB <= 0}
                className="self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[var(--fg-3)] hover:text-[var(--fg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label={`Remover último voto de ${duel.entryB.competitor.name}`}
              >
                <span aria-hidden className="text-base leading-none">−</span> Remover voto
              </button>
            </div>
          ) : null;
          // photoLeftSlot === 'b' → entry B is on the left; otherwise A left (today's order).
          const ordered = photoLeftSlot === 'b' ? [buttonB, buttonA] : [buttonA, buttonB];
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              {ordered}
            </div>
          );
        })()}

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
          <h4 className="text-xl md:text-2xl font-display font-bold text-[var(--fg)] leading-tight line-clamp-2">
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
