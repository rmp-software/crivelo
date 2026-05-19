'use client';

import { useState, useRef } from 'react';
import Button from './Button';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { Camera, Trophy, Upload } from 'lucide-react';

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
  onRefresh: () => void;
}

export default function TapToTally({ duel, onRefresh }: TapToTallyProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      alert(err.message || 'Failed to start duel');
    } finally {
      setIsStarting(false);
    }
  };

  const handleVote = async (cup: 'A' | 'B') => {
    if (isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/duels/${duel.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cup }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record vote');
      }

      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to record vote');
    } finally {
      setIsVoting(false);
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

      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCompleteDuel = async () => {
    if (!selectedWinner) return;

    setIsCompleting(true);
    try {
      const response = await fetch(`/api/duels/${duel.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winner_entry_id: selectedWinner }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete duel');
      }

      setShowCompleteModal(false);
      setSelectedWinner(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to complete duel');
    } finally {
      setIsCompleting(false);
    }
  };

  const openCompleteModal = () => {
    // Auto-select winner based on votes
    if (duel.votesA > duel.votesB && duel.entryA) {
      setSelectedWinner(duel.entryA.id);
    } else if (duel.votesB > duel.votesA && duel.entryB) {
      setSelectedWinner(duel.entryB.id);
    } else if (duel.entryA) {
      setSelectedWinner(duel.entryA.id);
    }
    setShowCompleteModal(true);
  };

  if (duel.status === 'pending') {
    return (
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-[var(--fg)] mb-4 font-[family-name:var(--font-display)]">
            Duelo {duel.position + 1} - Pronto para começar
          </h3>
          <p className="text-[var(--fg-2)] mb-6">
            Clique no botão abaixo para iniciar este duelo
          </p>
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
                Iniciar Duelo
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (duel.status === 'completed') {
    return (
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <div className="text-center py-8">
          <Trophy size={48} className="mx-auto text-[var(--success)] mb-4" />
          <h3 className="text-xl font-semibold text-[var(--fg)] mb-2 font-[family-name:var(--font-display)]">
            Duelo Concluído
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
                    Alterar Foto
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
                  Fotografar Copos
                </>
              )}
            </Button>
          )}
        </div>

        {/* Competitors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Competitor A */}
          {duel.entryA && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)]">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
                  <img
                    src={duel.entryA.competitor.photoUrl}
                    alt={duel.entryA.competitor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[var(--fg)] truncate">
                    {duel.entryA.competitor.name}
                  </h4>
                  <p className="text-sm text-[var(--fg-2)] truncate">
                    {duel.entryA.competitor.coffeeShop}
                  </p>
                  <p className="text-xs text-[var(--fg-3)] mt-1">Copa A</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleVote('A')}
                disabled={isVoting}
                className="w-full"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Votar Copa A</span>
                  <span className="text-2xl font-bold">{duel.votesA}</span>
                </div>
              </Button>
            </div>
          )}

          {/* Competitor B */}
          {duel.entryB && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)]">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
                  <img
                    src={duel.entryB.competitor.photoUrl}
                    alt={duel.entryB.competitor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[var(--fg)] truncate">
                    {duel.entryB.competitor.name}
                  </h4>
                  <p className="text-sm text-[var(--fg-2)] truncate">
                    {duel.entryB.competitor.coffeeShop}
                  </p>
                  <p className="text-xs text-[var(--fg-3)] mt-1">Copa B</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleVote('B')}
                disabled={isVoting}
                className="w-full"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Votar Copa B</span>
                  <span className="text-2xl font-bold">{duel.votesB}</span>
                </div>
              </Button>
            </div>
          )}
        </div>

        {/* Complete Duel Button */}
        <div className="pt-6 border-t border-[var(--border)]">
          <Button
            variant="success"
            onClick={openCompleteModal}
            className="w-full"
          >
            <Trophy size={20} />
            Encerrar Duelo
          </Button>
        </div>
      </div>

      {/* Complete Duel Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedWinner(null);
        }}
        title="Encerrar Duelo"
      >
        <div className="space-y-4">
          <p className="text-[var(--fg-2)]">
            Selecione o vencedor deste duelo. O vencedor avançará para a próxima rodada.
          </p>

          {/* Winner Selection */}
          <div className="space-y-3">
            {duel.entryA && (
              <button
                onClick={() => setSelectedWinner(duel.entryA!.id)}
                className={`w-full p-4 rounded-[var(--radius-md)] border-2 transition-colors ${
                  selectedWinner === duel.entryA.id
                    ? 'border-[var(--success)] bg-[var(--success-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--fg-4)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
                    <img
                      src={duel.entryA.competitor.photoUrl}
                      alt={duel.entryA.competitor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[var(--fg)]">
                      {duel.entryA.competitor.name}
                    </p>
                    <p className="text-sm text-[var(--fg-2)]">
                      Copa A - {duel.votesA} votos
                    </p>
                  </div>
                  {selectedWinner === duel.entryA.id && (
                    <Trophy size={20} className="text-[var(--success)]" />
                  )}
                </div>
              </button>
            )}

            {duel.entryB && (
              <button
                onClick={() => setSelectedWinner(duel.entryB!.id)}
                className={`w-full p-4 rounded-[var(--radius-md)] border-2 transition-colors ${
                  selectedWinner === duel.entryB.id
                    ? 'border-[var(--success)] bg-[var(--success-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--fg-4)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
                    <img
                      src={duel.entryB.competitor.photoUrl}
                      alt={duel.entryB.competitor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[var(--fg)]">
                      {duel.entryB.competitor.name}
                    </p>
                    <p className="text-sm text-[var(--fg-2)]">
                      Copa B - {duel.votesB} votos
                    </p>
                  </div>
                  {selectedWinner === duel.entryB.id && (
                    <Trophy size={20} className="text-[var(--success)]" />
                  )}
                </div>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCompleteModal(false);
                setSelectedWinner(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={handleCompleteDuel}
              disabled={!selectedWinner || isCompleting}
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
                  Confirmar Vencedor
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
