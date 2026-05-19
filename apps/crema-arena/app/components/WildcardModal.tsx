'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Trophy, User, Shuffle, CheckCircle } from 'lucide-react';

interface EliminatedCompetitor {
  entryId: string;
  competitorId: string;
  name: string;
  coffeeShop: string;
  photoUrl: string;
  eliminatedAtRound: number;
}

interface SlotEntry {
  id: string;
  competitor: {
    id: string;
    name: string;
    photoUrl: string;
    coffeeShop: string;
  };
}

interface WildcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  duelId: string;
  onSuccess: () => void;
  entryA: SlotEntry | null;
  entryB: SlotEntry | null;
}

export default function WildcardModal({ isOpen, onClose, duelId, onSuccess, entryA, entryB }: WildcardModalProps) {
  const emptySlot: 'a' | 'b' | null = !entryA ? 'a' : !entryB ? 'b' : null;
  const bothFilled = !!entryA && !!entryB;

  const [step, setStep] = useState<'select-slot' | 'select-type' | 'manual-pick' | 'random-confirm'>(
    bothFilled ? 'select-slot' : 'select-type'
  );
  const [targetSlot, setTargetSlot] = useState<'a' | 'b' | null>(emptySlot);
  const [eliminatedCompetitors, setEliminatedCompetitors] = useState<EliminatedCompetitor[]>([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState<EliminatedCompetitor | null>(null);
  const [randomCompetitor, setRandomCompetitor] = useState<EliminatedCompetitor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEliminatedCompetitors();
      setStep(bothFilled ? 'select-slot' : 'select-type');
      setTargetSlot(emptySlot);
    } else {
      // Reset state when modal closes
      setStep(bothFilled ? 'select-slot' : 'select-type');
      setTargetSlot(emptySlot);
      setSelectedCompetitor(null);
      setRandomCompetitor(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchEliminatedCompetitors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/duels/${duelId}/wildcard`);

      if (!response.ok) {
        throw new Error('Failed to fetch eliminated competitors');
      }

      const data = await response.json();
      setEliminatedCompetitors(data.eliminatedCompetitors);
    } catch (err: any) {
      alert(err.message || 'Failed to load eliminated competitors');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalkover = async () => {
    if (!confirm('Tem certeza que deseja fazer um W.O.? O oponente presente avançará automaticamente.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/duels/${duelId}/wildcard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wildcard_type: 'walkover' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process walkover');
      }

      alert('W.O. processado com sucesso!');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to process walkover');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualPick = (competitor: EliminatedCompetitor) => {
    setSelectedCompetitor(competitor);
  };

  const handleManualSubmit = async () => {
    if (!selectedCompetitor) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/duels/${duelId}/wildcard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wildcard_type: 'manual',
          selected_competitor_id: selectedCompetitor.competitorId,
          target_slot: targetSlot,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add wildcard');
      }

      alert(`${selectedCompetitor.name} foi adicionado como wildcard!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to add wildcard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRandomPick = () => {
    if (eliminatedCompetitors.length === 0) {
      alert('Não há competidores eliminados disponíveis');
      return;
    }

    // Randomly select a competitor
    const randomIndex = Math.floor(Math.random() * eliminatedCompetitors.length);
    const selected = eliminatedCompetitors[randomIndex];
    setRandomCompetitor(selected);
    setStep('random-confirm');
  };

  const handleRandomSubmit = async () => {
    if (!randomCompetitor) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/duels/${duelId}/wildcard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wildcard_type: 'random',
          selected_competitor_id: randomCompetitor.competitorId,
          target_slot: targetSlot,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add wildcard');
      }

      alert(`${randomCompetitor.name} foi sorteado e adicionado como wildcard!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to add wildcard');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Wildcard">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[var(--fg-2)]">Carregando opções...</p>
        </div>
      </Modal>
    );
  }

  if (step === 'select-slot' && bothFilled && entryA && entryB) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Substituir Competidor">
        <div className="space-y-4">
          <p className="text-[var(--fg-2)]">
            Qual competidor você deseja substituir?
          </p>

          <div className="space-y-3">
            {([
              { slot: 'a' as const, entry: entryA, label: 'Copa A' },
              { slot: 'b' as const, entry: entryB, label: 'Copa B' },
            ]).map(({ slot, entry, label }) => (
              <button
                key={slot}
                onClick={() => {
                  setTargetSlot(slot);
                  setStep('select-type');
                }}
                className="w-full p-4 rounded-[var(--radius-md)] border-2 border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
                    <img
                      src={entry.competitor.photoUrl}
                      alt={entry.competitor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--fg)]">{entry.competitor.name}</p>
                    <p className="text-sm text-[var(--fg-2)]">{entry.competitor.coffeeShop}</p>
                    <p className="text-xs text-[var(--fg-3)] mt-1">{label}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (step === 'select-type') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Selecione Tipo de Wildcard">
        <div className="space-y-4">
          <p className="text-[var(--fg-2)]">
            {bothFilled
              ? 'Escolha como substituir o competidor selecionado:'
              : 'Escolha como deseja preencher a vaga vazia neste duelo:'}
          </p>

          <div className="space-y-3">
            {/* Walkover Option — only when there's an empty slot */}
            {!bothFilled && (
              <button
                onClick={handleWalkover}
                disabled={isSubmitting}
                className="w-full p-4 rounded-[var(--radius-md)] border-2 border-[var(--border)] bg-[var(--surface)] hover:border-[var(--warning)] hover:bg-[var(--warning-soft)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--warning-soft)] border-2 border-[var(--warning)] flex items-center justify-center flex-shrink-0">
                    <Trophy size={24} className="text-[var(--warning)]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--fg)]">Walkover (W.O.)</p>
                    <p className="text-sm text-[var(--fg-2)]">
                      Oponente avança automaticamente sem competidor adversário
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Manual Pick Option */}
            <button
              onClick={() => setStep('manual-pick')}
              disabled={eliminatedCompetitors.length === 0}
              className="w-full p-4 rounded-[var(--radius-md)] border-2 border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--brand-soft)] border-2 border-[var(--brand)] flex items-center justify-center flex-shrink-0">
                  <User size={24} className="text-[var(--brand)]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--fg)]">Escolha Manual</p>
                  <p className="text-sm text-[var(--fg-2)]">
                    Selecione um competidor eliminado para retornar
                    {eliminatedCompetitors.length === 0 && ' (nenhum disponível)'}
                  </p>
                </div>
              </div>
            </button>

            {/* Random Pick Option */}
            <button
              onClick={handleRandomPick}
              disabled={eliminatedCompetitors.length === 0}
              className="w-full p-4 rounded-[var(--radius-md)] border-2 border-[var(--border)] bg-[var(--surface)] hover:border-[var(--success)] hover:bg-[var(--success-soft)] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--success-soft)] border-2 border-[var(--success)] flex items-center justify-center flex-shrink-0">
                  <Shuffle size={24} className="text-[var(--success)]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--fg)]">Sorteio Aleatório</p>
                  <p className="text-sm text-[var(--fg-2)]">
                    Sistema sorteia um competidor eliminado
                    {eliminatedCompetitors.length === 0 && ' (nenhum disponível)'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  if (step === 'manual-pick') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Selecione um Competidor">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[var(--fg-2)]">
              Escolha um competidor eliminado para retornar como wildcard:
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('select-type')}
            >
              Voltar
            </Button>
          </div>

          {/* Competitors List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {eliminatedCompetitors.map((competitor) => (
              <button
                key={competitor.entryId}
                onClick={() => handleManualPick(competitor)}
                className={`w-full p-3 rounded-[var(--radius-md)] border-2 transition-colors ${
                  selectedCompetitor?.entryId === competitor.entryId
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--fg-4)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
                    <img
                      src={competitor.photoUrl}
                      alt={competitor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[var(--fg)]">{competitor.name}</p>
                    <p className="text-sm text-[var(--fg-2)]">{competitor.coffeeShop}</p>
                    <p className="text-xs text-[var(--fg-3)]">
                      Eliminado na Rodada {competitor.eliminatedAtRound}
                    </p>
                  </div>
                  {selectedCompetitor?.entryId === competitor.entryId && (
                    <CheckCircle size={20} className="text-[var(--brand)] flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setStep('select-type')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleManualSubmit}
              disabled={!selectedCompetitor || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adicionando...
                </>
              ) : (
                'Confirmar Wildcard'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (step === 'random-confirm' && randomCompetitor) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Competidor Sorteado">
        <div className="space-y-4">
          <p className="text-[var(--fg-2)]">
            O sistema sorteou o seguinte competidor:
          </p>

          {/* Selected Competitor Card */}
          <div className="p-4 rounded-[var(--radius-md)] border-2 border-[var(--success)] bg-[var(--success-soft)]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
                <img
                  src={randomCompetitor.photoUrl}
                  alt={randomCompetitor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-[var(--fg)]">
                  {randomCompetitor.name}
                </p>
                <p className="text-sm text-[var(--fg-2)]">{randomCompetitor.coffeeShop}</p>
                <p className="text-xs text-[var(--fg-3)] mt-1">
                  Eliminado na Rodada {randomCompetitor.eliminatedAtRound}
                </p>
              </div>
              <Shuffle size={32} className="text-[var(--success)] flex-shrink-0" />
            </div>
          </div>

          <p className="text-sm text-[var(--fg-3)] text-center">
            Confirme para adicionar este competidor como wildcard
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setStep('select-type');
                setRandomCompetitor(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setRandomCompetitor(null);
                handleRandomPick(); // Re-roll
              }}
              className="flex-1"
            >
              <Shuffle size={20} />
              Sortear Novamente
            </Button>
            <Button
              variant="primary"
              onClick={handleRandomSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Confirmando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return null;
}
