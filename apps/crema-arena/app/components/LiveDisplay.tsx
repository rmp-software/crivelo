'use client';

import { useEffect, useState } from 'react';
import LiveCompetitorCard from './LiveCompetitorCard';

interface Competitor {
  id: string;
  name: string;
  photo_url: string;
  coffee_shop: string;
}

interface Entry {
  id: string;
  competitor: Competitor;
}

interface Duel {
  id: string;
  round: number;
  position: number;
  status: string;
  votesA: number;
  votesB: number;
  pourPhotoUrl: string | null;
  entryA: Entry | null;
  entryB: Entry | null;
}

interface Event {
  id: string;
  name: string;
  status: string;
  date: string;
  location: string | null;
  judgesCount: number;
}

interface CurrentDuelData {
  event: Event;
  currentDuel: Duel | null;
  nextDuel: Duel | null;
  currentRound: number | null;
  totalRounds: number;
}

interface BracketDuel {
  id: string;
  round: number;
  position: number;
  status: string;
  votesA: number;
  votesB: number;
  entryA: Entry | null;
  entryB: Entry | null;
  winner: Entry | null;
}

interface BracketData {
  event: {
    id: string;
    name: string;
    status: string;
    bracketSize: number | null;
  };
  duels: BracketDuel[];
  totalRounds: number;
}

interface LiveDisplayProps {
  eventId: string;
}

export default function LiveDisplay({ eventId }: LiveDisplayProps) {
  const [data, setData] = useState<CurrentDuelData | null>(null);
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current duel and bracket data
  const fetchData = async () => {
    try {
      const [currentDuelResponse, bracketResponse] = await Promise.all([
        fetch(`/api/events/${eventId}/current-duel`),
        fetch(`/api/events/${eventId}/bracket`),
      ]);

      if (!currentDuelResponse.ok || !bracketResponse.ok) {
        throw new Error('Failed to fetch event data');
      }

      const currentDuelData = await currentDuelResponse.json();
      const bracketData = await bracketResponse.json();

      setData(currentDuelData);
      setBracketData(bracketData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling setup
  useEffect(() => {
    fetchData();

    // Poll every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--espresso-900)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--crema-50)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-display text-[var(--crema-50)]">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--espresso-900)]">
        <div className="text-center max-w-lg p-8">
          <h1 className="text-4xl font-display font-bold text-[var(--cherry-500)] mb-4">
            Error
          </h1>
          <p className="text-xl text-[var(--crema-50)]">
            {error || 'No se pudo cargar el evento'}
          </p>
        </div>
      </div>
    );
  }

  const { event, currentDuel, nextDuel, currentRound, totalRounds } = data;

  // Setup state - show event info
  if (event.status === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--espresso-900)] p-8">
        <div className="text-center max-w-4xl">
          <h1 className="text-6xl font-display font-bold text-[var(--crema-50)] mb-6">
            {event.name}
          </h1>
          <div className="space-y-4 text-[var(--crema-100)]">
            <p className="text-3xl font-serif italic">
              {new Date(event.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {event.location && (
              <p className="text-2xl font-display">{event.location}</p>
            )}
            <p className="text-2xl font-display mt-8">
              Jueces: {event.judgesCount}
            </p>
          </div>
          <div className="mt-12 p-8 bg-[var(--espresso-700)] rounded-[var(--radius-lg)]">
            <p className="text-2xl font-display text-[var(--crema-50)]">
              El torneo comenzará pronto...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Finished state - show winner
  if (event.status === 'finished' && bracketData) {
    const finalDuel = bracketData.duels.find(
      (d) => d.round === totalRounds && d.status === 'completed'
    );
    const winner = finalDuel?.winner;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--espresso-900)] p-8">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl font-display font-bold text-[var(--marigold-500)] mb-8">
            🏆 ¡CAMPEÓN! 🏆
          </h1>
          <h2 className="text-6xl font-display font-bold text-[var(--crema-50)] mb-6">
            {event.name}
          </h2>
          {winner && (
            <div className="mt-12">
              <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-8 border-[var(--marigold-500)] shadow-2xl mb-8">
                <img
                  src={winner.competitor.photo_url}
                  alt={winner.competitor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-5xl font-display font-bold text-[var(--crema-50)] mb-4">
                {winner.competitor.name}
              </h3>
              <p className="text-3xl font-serif italic text-[var(--crema-100)]">
                {winner.competitor.coffee_shop}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Running with active duel
  if (currentDuel && currentDuel.entryA && currentDuel.entryB) {
    return (
      <div className="min-h-screen bg-[var(--espresso-900)] p-8 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-[var(--crema-50)] mb-2">
            {event.name}
          </h1>
          <p className="text-2xl font-serif italic text-[var(--crema-100)]">
            Ronda {currentRound} de {totalRounds}
          </p>
        </div>

        {/* Competitors */}
        <div className="flex-1 flex items-center justify-center gap-8 px-8">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 w-full max-w-7xl">
            <LiveCompetitorCard
              competitor={currentDuel.entryA.competitor}
              score={currentDuel.votesA}
              side="A"
              isActive={true}
            />

            <div className="text-6xl font-display font-bold text-[var(--crema-50)] flex-shrink-0">
              VS
            </div>

            <LiveCompetitorCard
              competitor={currentDuel.entryB.competitor}
              score={currentDuel.votesB}
              side="B"
              isActive={true}
            />
          </div>
        </div>

        {/* Pour photo if available */}
        {currentDuel.pourPhotoUrl && (
          <div className="mt-8 flex justify-center">
            <div className="max-w-sm rounded-[var(--radius-lg)] overflow-hidden border-4 border-[var(--crema-200)] shadow-xl">
              <img
                src={currentDuel.pourPhotoUrl}
                alt="Pour"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Running between duels - show next matchup
  if (nextDuel && nextDuel.entryA && nextDuel.entryB) {
    return (
      <div className="min-h-screen bg-[var(--espresso-900)] p-8 flex flex-col items-center justify-center">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl font-display font-bold text-[var(--crema-50)] mb-8">
            {event.name}
          </h1>
          <p className="text-3xl font-serif italic text-[var(--marigold-500)] mb-12">
            Ronda {currentRound} de {totalRounds}
          </p>

          <div className="p-12 bg-[var(--espresso-700)] rounded-[var(--radius-lg)] mb-12">
            <h2 className="text-4xl font-display font-bold text-[var(--crema-50)] mb-8">
              Próximo:
            </h2>
            <div className="space-y-4">
              <p className="text-3xl font-display text-[var(--crema-50)]">
                {nextDuel.entryA.competitor.name}
              </p>
              <p className="text-2xl font-serif italic text-[var(--crema-100)]">
                {nextDuel.entryA.competitor.coffee_shop}
              </p>
              <p className="text-4xl font-display font-bold text-[var(--crema-50)] my-4">
                VS
              </p>
              <p className="text-3xl font-display text-[var(--crema-50)]">
                {nextDuel.entryB.competitor.name}
              </p>
              <p className="text-2xl font-serif italic text-[var(--crema-100)]">
                {nextDuel.entryB.competitor.coffee_shop}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default running state (no active or next duel)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--espresso-900)] p-8">
      <div className="text-center max-w-4xl">
        <h1 className="text-5xl font-display font-bold text-[var(--crema-50)] mb-6">
          {event.name}
        </h1>
        <div className="p-8 bg-[var(--espresso-700)] rounded-[var(--radius-lg)]">
          <p className="text-2xl font-display text-[var(--crema-50)]">
            En progreso...
          </p>
        </div>
      </div>
    </div>
  );
}
