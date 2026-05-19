'use client';

import { ReactNode } from 'react';
import { Calendar, MapPin, Users, Share2 } from 'lucide-react';
import Button from './Button';
import { useToast } from './Toast';

interface RunningTopBarProps {
  eventName: string;
  date: string; // ISO
  location: string | null;
  judgesCount: number;
  currentRound: number | null;
  totalRounds: number;
  completedInRound: number;
  totalInRound: number;
  audienceUrl: string;
  liveUrl: string;
  /** Right-hand primary action — e.g. "Encerrar evento" when the final completes. */
  primaryAction?: ReactNode;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function roundLabel(current: number | null, total: number): string {
  if (current == null) return '';
  if (current === total) return 'Final';
  if (current === total - 1) return 'Semifinal';
  return `Rodada ${current}`;
}

export default function RunningTopBar({
  eventName,
  date,
  location,
  judgesCount,
  currentRound,
  totalRounds,
  completedInRound,
  totalInRound,
  audienceUrl,
  liveUrl,
  primaryAction,
}: RunningTopBarProps) {
  const { showToast } = useToast();

  const copyAudience = async () => {
    try {
      await navigator.clipboard.writeText(audienceUrl);
      showToast('Link da plateia copiado.', 'success');
    } catch {
      showToast('Não foi possível copiar o link', 'error');
    }
  };

  return (
    <header className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)] mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--live-soft)] text-[var(--live)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)]" aria-hidden />
              <span className="font-mono text-[10px] font-semibold tracking-wider uppercase">
                Ao vivo
              </span>
            </span>
            {currentRound != null && (
              <span className="text-sm text-[var(--fg-3)]">
                {roundLabel(currentRound, totalRounds)} ·{' '}
                <span className="font-mono tabular-nums">
                  {completedInRound} de {totalInRound}
                </span>{' '}
                duelos concluídos
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-[var(--fg)] leading-tight">
            {eventName}
          </h1>
          <p className="mt-1 text-sm text-[var(--fg-3)] flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} aria-hidden /> {formatDate(date)}
            </span>
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} aria-hidden /> {location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} aria-hidden /> {judgesCount}{' '}
              {judgesCount === 1 ? 'juiz' : 'juízes'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={copyAudience}>
            <Share2 size={16} />
            Link da plateia
          </Button>
          {primaryAction}
        </div>
      </div>
    </header>
  );
}
