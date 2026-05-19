'use client';

import { useState } from 'react';
import useSWR from 'swr';
import AoVivoTab from './tabs/AoVivoTab';
import ChaveTab from './tabs/ChaveTab';
import LeaderboardTab from './tabs/LeaderboardTab';
import Badge from './Badge';

interface LiveCompanionProps {
  eventId: string;
}

type TabType = 'ao-vivo' | 'chave' | 'leaderboard';

interface EventData {
  id: string;
  name: string;
  status: 'setup' | 'running' | 'finished';
  date: string;
  location?: string;
  judgesCount: number;
}

interface CurrentDuelData {
  event: EventData;
  currentDuel: any;
  nextDuel: any;
  currentRound: number;
  totalRounds: number;
}

interface BracketData {
  event: any;
  duels: any[];
  totalRounds: number;
}

interface LeaderboardData {
  event: any;
  leaderboard: any[];
  isComplete: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch event data')));

export default function LiveCompanion({ eventId }: LiveCompanionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ao-vivo');

  const swrOpts = { refreshInterval: 5000, revalidateOnFocus: false };
  const { data: currentDuelData, error } = useSWR<CurrentDuelData>(`/api/events/${eventId}/current-duel`, fetcher, swrOpts);
  const { data: bracketData } = useSWR<BracketData>(`/api/events/${eventId}/bracket`, fetcher, swrOpts);
  const { data: leaderboardData } = useSWR<LeaderboardData>(`/api/events/${eventId}/leaderboard`, fetcher, swrOpts);
  const loading = !currentDuelData && !error;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center" role="status" aria-live="polite">
          <div
            className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[var(--brand)] border-t-transparent"
            style={{
              animationDuration: 'var(--dur-stage)',
              animationTimingFunction: 'linear',
            }}
            aria-hidden="true"
          ></div>
          <p className="mt-4 text-[var(--fg-3)]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !currentDuelData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md" role="alert" aria-live="assertive">
          <p className="text-[var(--fg-2)] text-lg font-semibold mb-2">
            Erro ao carregar evento
          </p>
          <p className="text-[var(--fg-3)] text-sm">{error || 'Evento não encontrado'}</p>
        </div>
      </div>
    );
  }

  const { event } = currentDuelData;
  const eventDate = new Date(event.date).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getStatusBadge = () => {
    switch (event.status) {
      case 'running':
        return <Badge variant="success">AO VIVO</Badge>;
      case 'finished':
        return <Badge variant="default">Encerrado</Badge>;
      default:
        return <Badge variant="default">Em preparação</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-50 bg-[var(--surface-raised)] border-b border-[var(--border)] shadow-[var(--shadow-1)]"
        style={{
          transitionProperty: 'box-shadow',
          transitionDuration: 'var(--dur-base)',
          transitionTimingFunction: 'var(--ease-standard)',
        }}
      >
        <div className="px-4 py-4 max-w-screen-sm mx-auto">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-[var(--fg)] font-[family-name:var(--font-display)] leading-tight">
                {event.name}
              </h1>
              <p className="text-xs text-[var(--fg-3)] mt-1 truncate">
                {eventDate}
                {event.location && ` • ${event.location}`}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-1 bg-[var(--bg-2)] rounded-[var(--radius-sm)] p-1" role="tablist">
            <button
              onClick={() => setActiveTab('ao-vivo')}
              className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-xs)] transition-all min-h-[44px] touch-manipulation ${
                activeTab === 'ao-vivo'
                  ? 'bg-[var(--surface-raised)] text-[var(--fg)] shadow-[var(--shadow-1)]'
                  : 'text-[var(--fg-3)] hover:text-[var(--fg-2)]'
              }`}
              style={{
                transitionDuration: 'var(--dur-base)',
                transitionTimingFunction: 'var(--ease-standard)',
              }}
              role="tab"
              aria-selected={activeTab === 'ao-vivo'}
              aria-controls="ao-vivo-panel"
            >
              Ao vivo
            </button>
            <button
              onClick={() => setActiveTab('chave')}
              className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-xs)] transition-all min-h-[44px] touch-manipulation ${
                activeTab === 'chave'
                  ? 'bg-[var(--surface-raised)] text-[var(--fg)] shadow-[var(--shadow-1)]'
                  : 'text-[var(--fg-3)] hover:text-[var(--fg-2)]'
              }`}
              style={{
                transitionDuration: 'var(--dur-base)',
                transitionTimingFunction: 'var(--ease-standard)',
              }}
              role="tab"
              aria-selected={activeTab === 'chave'}
              aria-controls="chave-panel"
            >
              Chave
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-xs)] transition-all min-h-[44px] touch-manipulation ${
                activeTab === 'leaderboard'
                  ? 'bg-[var(--surface-raised)] text-[var(--fg)] shadow-[var(--shadow-1)]'
                  : 'text-[var(--fg-3)] hover:text-[var(--fg-2)]'
              }`}
              style={{
                transitionDuration: 'var(--dur-base)',
                transitionTimingFunction: 'var(--ease-standard)',
              }}
              role="tab"
              aria-selected={activeTab === 'leaderboard'}
              aria-controls="leaderboard-panel"
            >
              Leaderboard
            </button>
          </nav>
        </div>
      </header>

      {/* Tab Content */}
      <main className="flex-1 pb-safe" role="main">
        <div
          id="ao-vivo-panel"
          role="tabpanel"
          aria-labelledby="ao-vivo"
          hidden={activeTab !== 'ao-vivo'}
        >
          {activeTab === 'ao-vivo' && (
            <AoVivoTab
              event={event}
              currentDuel={currentDuelData.currentDuel}
              nextDuel={currentDuelData.nextDuel}
              currentRound={currentDuelData.currentRound}
              totalRounds={currentDuelData.totalRounds}
            />
          )}
        </div>
        <div
          id="chave-panel"
          role="tabpanel"
          aria-labelledby="chave"
          hidden={activeTab !== 'chave'}
        >
          {activeTab === 'chave' && bracketData && (
            <ChaveTab
              event={bracketData.event}
              duels={bracketData.duels}
              totalRounds={bracketData.totalRounds}
              currentDuel={currentDuelData.currentDuel}
            />
          )}
        </div>
        <div
          id="leaderboard-panel"
          role="tabpanel"
          aria-labelledby="leaderboard"
          hidden={activeTab !== 'leaderboard'}
        >
          {activeTab === 'leaderboard' && leaderboardData && (
            <LeaderboardTab
              event={leaderboardData.event}
              leaderboard={leaderboardData.leaderboard}
              isComplete={leaderboardData.isComplete}
            />
          )}
        </div>
      </main>
    </div>
  );
}
