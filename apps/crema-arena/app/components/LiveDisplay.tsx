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
        <div className="text-center" role="status" aria-live="polite">
          <div
            className="w-16 h-16 border-4 border-[var(--crema-50)] border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              animationDuration: 'var(--dur-stage)',
              animationTimingFunction: 'linear',
            }}
            aria-hidden="true"
          ></div>
          <p className="text-2xl font-display text-[var(--crema-50)]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--espresso-900)] p-8">
        <div className="text-center max-w-2xl" role="alert" aria-live="assertive">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-[var(--cherry-500)] mb-6">
            Erro ao Carregar
          </h1>
          <p className="text-2xl md:text-3xl text-[var(--crema-50)]">
            {error || 'Não foi possível carregar o evento'}
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
              {new Date(event.date).toLocaleDateString('pt-BR', {
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
              Juízes: {event.judgesCount}
            </p>
          </div>
          <div className="mt-12 p-8 bg-[var(--espresso-700)] rounded-[var(--radius-lg)]">
            <p className="text-2xl font-display text-[var(--crema-50)]">
              O evento ainda não começou
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Finished state - show podium
  if (event.status === 'finished' && bracketData) {
    const finalDuel = bracketData.duels.find(
      (d) => d.round === totalRounds && d.status === 'completed'
    );
    const winner = finalDuel?.winner;
    const runnerUp = finalDuel
      ? (finalDuel.winner?.id === finalDuel.entryA?.id ? finalDuel.entryB : finalDuel.entryA)
      : null;
    const semiFinalLosers = totalRounds >= 2
      ? bracketData.duels
          .filter((d) => d.round === totalRounds - 1 && d.status === 'completed')
          .map((d) => (d.winner?.id === d.entryA?.id ? d.entryB : d.entryA))
          .filter(Boolean)
      : [];

    return (
      <div className="min-h-screen bg-[var(--espresso-900)] flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--crema-50)] mb-2 text-center">
          {event.name}
        </h1>
        <p className="text-2xl font-serif italic text-[var(--marigold-500)] mb-12">Resultado Final</p>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 md:gap-8 w-full max-w-4xl">
          {/* 2nd place */}
          {runnerUp && (
            <div className="flex flex-col items-center flex-1 max-w-[220px]">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[var(--crema-300)] shadow-xl mb-3">
                <img src={runnerUp.competitor.photo_url} alt={runnerUp.competitor.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-lg md:text-xl font-display font-bold text-[var(--crema-50)] text-center mb-1">
                {runnerUp.competitor.name}
              </p>
              <p className="text-sm font-serif italic text-[var(--crema-200)] text-center mb-3">
                {runnerUp.competitor.coffee_shop}
              </p>
              <div className="w-full bg-[var(--crema-300)] rounded-t-[var(--radius-sm)] flex items-center justify-center py-4">
                <span className="text-3xl font-display font-bold text-[var(--espresso-900)]">2</span>
              </div>
            </div>
          )}

          {/* 1st place */}
          {winner && (
            <div className="flex flex-col items-center flex-1 max-w-[260px]">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border-8 border-[var(--marigold-500)] shadow-2xl mb-3">
                <img src={winner.competitor.photo_url} alt={winner.competitor.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-xl md:text-2xl font-display font-bold text-[var(--crema-50)] text-center mb-1">
                {winner.competitor.name}
              </p>
              <p className="text-sm font-serif italic text-[var(--crema-200)] text-center mb-3">
                {winner.competitor.coffee_shop}
              </p>
              <div className="w-full bg-[var(--marigold-500)] rounded-t-[var(--radius-sm)] flex items-center justify-center py-6">
                <span className="text-4xl font-display font-bold text-[var(--espresso-900)]">1</span>
              </div>
            </div>
          )}

          {/* 3rd place */}
          {semiFinalLosers[0] && (
            <div className="flex flex-col items-center flex-1 max-w-[220px]">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-[var(--cinnamon-500)] shadow-xl mb-3">
                <img src={semiFinalLosers[0].competitor.photo_url} alt={semiFinalLosers[0].competitor.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-base md:text-lg font-display font-bold text-[var(--crema-50)] text-center mb-1">
                {semiFinalLosers[0].competitor.name}
              </p>
              <p className="text-sm font-serif italic text-[var(--crema-200)] text-center mb-3">
                {semiFinalLosers[0].competitor.coffee_shop}
              </p>
              <div className="w-full bg-[var(--cinnamon-500)] rounded-t-[var(--radius-sm)] flex items-center justify-center py-3">
                <span className="text-2xl font-display font-bold text-[var(--espresso-900)]">3</span>
              </div>
            </div>
          )}
        </div>

        {/* 4th and 5th if available */}
        {semiFinalLosers[1] && (
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-3 bg-[var(--espresso-700)] rounded-[var(--radius-md)] px-4 py-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--espresso-500)]">
                <img src={semiFinalLosers[1].competitor.photo_url} alt={semiFinalLosers[1].competitor.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-sm font-display text-[var(--crema-300)] mr-2">4º</span>
                <span className="font-display font-bold text-[var(--crema-50)]">{semiFinalLosers[1].competitor.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Running with active duel
  if (currentDuel && currentDuel.entryA && currentDuel.entryB) {
    return (
      <div className="min-h-screen bg-[var(--espresso-900)] p-4 md:p-8 lg:p-12 flex flex-col">
        {/* Header */}
        <header className="text-center mb-6 md:mb-8 lg:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-[var(--crema-50)] mb-2">
            {event.name}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl font-serif italic text-[var(--crema-100)]">
            Rodada {currentRound} de {totalRounds}
          </p>
        </header>

        {/* Competitors */}
        <div className="flex-1 flex items-center justify-center" role="main" aria-live="polite">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-12 xl:gap-20 w-full max-w-[1800px]">
            <LiveCompetitorCard
              competitor={currentDuel.entryA.competitor}
              score={currentDuel.votesA}
              side="A"
              isActive={true}
            />

            <div
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-[var(--crema-50)] flex-shrink-0"
              aria-hidden="true"
            >
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
          <div className="mt-6 md:mt-8 flex justify-center">
            <div className="max-w-xs md:max-w-sm lg:max-w-md rounded-[var(--radius-lg)] overflow-hidden border-4 border-[var(--crema-200)] shadow-[var(--shadow-2)]">
              <img
                src={currentDuel.pourPhotoUrl}
                alt="Foto do café servido"
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
            Rodada {currentRound} de {totalRounds}
          </p>

          <div className="p-12 bg-[var(--espresso-700)] rounded-[var(--radius-lg)] mb-12">
            <h2 className="text-4xl font-display font-bold text-[var(--crema-50)] mb-8">
              A seguir:
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
            Em andamento...
          </p>
        </div>
      </div>
    </div>
  );
}
