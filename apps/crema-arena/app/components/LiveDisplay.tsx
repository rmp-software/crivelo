'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

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
  status: string;
  votesA: number;
  votesB: number;
  pourPhotoUrl: string | null;
  startedAt: string | null;
  isBronzeMatch?: boolean;
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
  isBronzeMatch?: boolean;
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

interface LeaderboardEntry {
  entryId: string;
  competitor: Competitor;
  status: string;
  wins: number;
  eliminatedAtRound: number | null;
  totalVotesReceived: number;
  position: number;
}

interface LeaderboardData {
  event: { id: string; name: string; status: string };
  leaderboard: LeaderboardEntry[];
  isComplete: boolean;
}

interface LiveDisplayProps {
  eventId: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch event data')));
const tolerantFetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null));

export default function LiveDisplay({ eventId }: LiveDisplayProps) {
  // Split-cadence polling: the current-duel payload is small and the hottest
  // (vote ticks, pour photos, duel transitions) — poll fast. Bracket and
  // leaderboard are heavier and change less often — keep the spec's 5s.
  const fastOpts = { refreshInterval: 1000, revalidateOnFocus: false };
  const slowOpts = { refreshInterval: 5000, revalidateOnFocus: false };
  const { data, error } = useSWR<CurrentDuelData>(`/api/events/${eventId}/current-duel`, fetcher, fastOpts);
  const { data: bracketData } = useSWR<BracketData>(`/api/events/${eventId}/bracket`, fetcher, slowOpts);
  const { data: leaderboard } = useSWR<LeaderboardData>(`/api/events/${eventId}/leaderboard`, tolerantFetcher, slowOpts);
  const loading = !data && !error;

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
            {error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Não foi possível carregar o evento'}
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
  if (event.status === 'finished') {
    const top5 = leaderboard?.leaderboard.slice(0, 5) ?? [];
    const first = top5[0];
    const second = top5[1];
    const third = top5[2];
    const fourth = top5[3];
    const fifth = top5[4];

    return (
      <div className="min-h-screen bg-[var(--bg-inverse)] text-[var(--fg-inverse)] flex flex-col items-center px-6 py-10 md:py-14">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-center text-balance">
          {event.name}
        </h1>
        <p className="text-2xl md:text-3xl font-serif italic text-[var(--marigold-500)] mt-2">
          Resultado final
        </p>
        <p className="text-sm md:text-base text-[var(--crema-300)] mt-2">
          {new Date(event.date).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        {top5.length === 0 ? (
          <p className="mt-16 text-xl font-serif italic text-[var(--crema-200)]">
            Aguardando resultados...
          </p>
        ) : (
          <div className="mt-12 md:mt-16 w-full max-w-6xl">
            {/* Top 3 podium (with 4th/5th flanking lower on each side) */}
            <div className="flex items-end justify-center gap-3 md:gap-6">
              {fourth && <FlankSlot entry={fourth} position={4} />}
              {second && <PodiumSlot entry={second} position={2} />}
              {first && <PodiumSlot entry={first} position={1} />}
              {third && <PodiumSlot entry={third} position={3} />}
              {fifth && <FlankSlot entry={fifth} position={5} />}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Running with active duel
  if (currentDuel && currentDuel.entryA && currentDuel.entryB) {
    const roundLabel = duelSubtitle(currentDuel, currentRound, totalRounds);
    const currentRoundDuels = bracketData
      ? bracketData.duels.filter((d) => d.round === currentRound)
      : [];
    const hasPour = !!currentDuel.pourPhotoUrl;

    return (
      <div className="h-screen bg-[var(--espresso-900)] flex flex-col relative overflow-hidden">
        {/* Top bar: AO VIVO + title + duel timer */}
        <header className="flex items-start justify-between p-6 md:p-8 lg:p-10 flex-shrink-0">
          <LiveBadge />
          <div className="text-center flex-1 px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-[var(--crema-50)] leading-tight">
              {event.name}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-serif italic text-[var(--crema-200)] mt-1">
              {roundLabel}
            </p>
          </div>
          {currentDuel.startedAt ? (
            <DuelTimer startedAt={currentDuel.startedAt} />
          ) : (
            <div className="w-[88px] md:w-[110px]" aria-hidden />
          )}
        </header>

        {/* Main area — no vertical scroll on TV */}
        <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 md:px-10 lg:px-16 pb-40 gap-6 md:gap-8" role="main" aria-live="polite">
          {hasPour ? (
            <PourPhotoCenterpiece
              pourPhotoUrl={currentDuel.pourPhotoUrl!}
              entryA={currentDuel.entryA}
              entryB={currentDuel.entryB}
              votesA={currentDuel.votesA}
              votesB={currentDuel.votesB}
            />
          ) : (
            <ProfileCardsCenterpiece
              entryA={currentDuel.entryA}
              entryB={currentDuel.entryB}
              votesA={currentDuel.votesA}
              votesB={currentDuel.votesB}
            />
          )}

          {/* Mini bracket strip — only real duels (both slots filled) */}
          {currentRoundDuels.filter((d) => d.entryA && d.entryB).length > 1 && (
            <MiniBracketStrip
              duels={currentRoundDuels.filter((d) => d.entryA && d.entryB)}
              activeDuelId={currentDuel.id}
              totalRounds={totalRounds}
            />
          )}
        </main>

        {/* QR — bottom-right (fixed to viewport) */}
        <QrBadge eventId={eventId} />
      </div>
    );
  }

  // Between duels — show the next matchup using the same layout as the active
  // state (avatars + names + coffee shops + mini-bracket strip) so context isn't
  // lost. Timer area gets an "Próximo duelo" label instead of an elapsed clock.
  if (nextDuel && nextDuel.entryA && nextDuel.entryB) {
    const roundLabel = duelSubtitle(nextDuel, currentRound, totalRounds);
    const currentRoundDuels = bracketData
      ? bracketData.duels.filter((d) => d.round === currentRound)
      : [];

    return (
      <div className="h-screen bg-[var(--espresso-900)] flex flex-col relative overflow-hidden">
        <header className="flex items-start justify-between p-6 md:p-8 lg:p-10 flex-shrink-0">
          <LiveBadge />
          <div className="text-center flex-1 px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-[var(--crema-50)] leading-tight">
              {event.name}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-serif italic text-[var(--crema-200)] mt-1">
              {roundLabel}
            </p>
          </div>
          <NextDuelLabel />
        </header>

        <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 md:px-10 lg:px-16 pb-40 gap-6 md:gap-8" role="main" aria-live="polite">
          <ProfileCardsCenterpiece
            entryA={nextDuel.entryA}
            entryB={nextDuel.entryB}
            votesA={0}
            votesB={0}
          />

          {currentRoundDuels.filter((d) => d.entryA && d.entryB).length > 1 && (
            <MiniBracketStrip
              duels={currentRoundDuels.filter((d) => d.entryA && d.entryB)}
              activeDuelId={nextDuel.id}
              totalRounds={totalRounds}
            />
          )}
        </main>

        <QrBadge eventId={eventId} />
      </div>
    );
  }

  // Default running state (no active or next duel)
  return (
    <div className="h-screen bg-[var(--espresso-900)] flex flex-col relative overflow-hidden">
      <header className="flex items-start justify-between p-6 md:p-8 lg:p-10 flex-shrink-0">
        <LiveBadge />
        <div className="text-center flex-1 px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-[var(--crema-50)] leading-tight">
            {event.name}
          </h1>
        </div>
        <div className="w-[88px] md:w-[110px]" aria-hidden />
      </header>
      <main className="flex-1 flex items-center justify-center px-8 pb-40">
        <p className="text-2xl font-serif italic text-[var(--crema-200)]">
          Aguardando próximo duelo...
        </p>
      </main>
      <QrBadge eventId={eventId} />
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-full)] bg-[var(--live-soft)] text-[var(--live)] flex-shrink-0">
      <span className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse" aria-hidden />
      <span className="font-mono text-xs md:text-sm font-semibold tracking-wider uppercase">
        Ao vivo
      </span>
    </div>
  );
}

function DuelTimer({ startedAt }: { startedAt: string }) {
  const startMs = new Date(startedAt).getTime();
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setElapsedMs(Math.max(0, Date.now() - startMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMs]);

  const display = elapsedMs == null ? '--:--' : formatElapsed(elapsedMs);

  return (
    <div
      className="inline-flex flex-col items-end flex-shrink-0"
      aria-label={elapsedMs == null ? undefined : `Tempo do duelo ${display}`}
    >
      <span className="font-mono text-[10px] md:text-xs uppercase tracking-wider text-[var(--crema-300)]">
        Tempo
      </span>
      <span className="font-mono text-2xl md:text-3xl lg:text-4xl font-semibold tabular-nums text-[var(--crema-50)] leading-none mt-1">
        {display}
      </span>
    </div>
  );
}

function NextDuelLabel() {
  return (
    <div className="inline-flex flex-col items-end flex-shrink-0">
      <span className="font-mono text-[10px] md:text-xs uppercase tracking-wider text-[var(--crema-300)]">
        A seguir
      </span>
      <span className="font-display text-lg md:text-xl font-semibold text-[var(--marigold-500)] leading-none mt-1">
        Próximo duelo
      </span>
    </div>
  );
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function QrBadge({ eventId }: { eventId: string }) {
  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex items-center gap-3 bg-[var(--crema-50)] rounded-[var(--radius-md)] p-3 md:p-4 shadow-[var(--shadow-2)]">
      <img
        src={`/api/events/${eventId}/qr`}
        alt="QR code para acompanhar pelo celular"
        className="w-20 h-20 md:w-28 md:h-28"
      />
      <p className="text-xs md:text-sm font-display font-semibold text-[var(--espresso-900)] max-w-[120px] leading-tight">
        Acompanhe pelo celular
      </p>
    </div>
  );
}

function ProfileCardsCenterpiece({
  entryA,
  entryB,
  votesA,
  votesB,
}: {
  entryA: Entry;
  entryB: Entry;
  votesA: number;
  votesB: number;
}) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 md:gap-10 lg:gap-12 w-full max-w-[1800px]">
      <CompetitorBlock competitor={entryA.competitor} side="A" />
      <CentralScore a={votesA} b={votesB} />
      <CompetitorBlock competitor={entryB.competitor} side="B" />
    </div>
  );
}

function CompetitorBlock({ competitor }: { competitor: Competitor; side: 'A' | 'B' }) {
  return (
    <div className="flex flex-col items-center text-center max-w-md flex-1">
      <div className="w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 rounded-full overflow-hidden border-4 border-[var(--crema-200)] shadow-[var(--shadow-2)] mb-5">
        <img src={competitor.photoUrl} alt={competitor.name} className="w-full h-full object-cover" />
      </div>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-[var(--crema-50)] leading-tight">
        {competitor.name}
      </h2>
      <p className="text-lg md:text-xl lg:text-2xl font-serif italic text-[var(--crema-200)] mt-2">
        {competitor.coffeeShop}
      </p>
    </div>
  );
}

function CentralScore({ a, b }: { a: number; b: number }) {
  return (
    <div
      className="font-mono font-semibold text-[var(--crema-50)] tabular-nums flex-shrink-0 leading-none"
      style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}
      aria-label={`Placar atual: ${a} a ${b}`}
    >
      {a} × {b}
    </div>
  );
}

function PourPhotoCenterpiece({
  pourPhotoUrl,
  entryA,
  entryB,
  votesA,
  votesB,
}: {
  pourPhotoUrl: string;
  entryA: Entry;
  entryB: Entry;
  votesA: number;
  votesB: number;
}) {
  // No text overlay — sits cleanly above a separate competitor-info row so
  // names stay readable regardless of the photo's exposure. Height capped so
  // the TV viewport never scrolls.
  return (
    <div className="flex flex-col items-center w-full max-w-5xl gap-4 md:gap-6">
      <div className="rounded-[var(--radius-lg)] overflow-hidden border-4 border-[var(--crema-200)] shadow-[var(--shadow-2)]">
        <img
          src={pourPhotoUrl}
          alt="Foto dos copos servidos"
          className="block w-auto max-w-full max-h-[44vh] object-contain"
        />
      </div>

      <div className="flex items-center justify-center gap-6 md:gap-10 w-full">
        <div className="flex-1 min-w-0 text-right">
          <p className="text-2xl md:text-4xl font-display font-bold text-[var(--crema-50)] truncate">
            {entryA.competitor.name}
          </p>
          <p className="text-base md:text-xl font-serif italic text-[var(--crema-200)] truncate">
            {entryA.competitor.coffeeShop}
          </p>
        </div>
        <div
          className="font-mono font-semibold text-[var(--crema-50)] tabular-nums flex-shrink-0 leading-none"
          style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}
          aria-label={`Placar atual: ${votesA} a ${votesB}`}
        >
          {votesA} × {votesB}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-2xl md:text-4xl font-display font-bold text-[var(--crema-50)] truncate">
            {entryB.competitor.name}
          </p>
          <p className="text-base md:text-xl font-serif italic text-[var(--crema-200)] truncate">
            {entryB.competitor.coffeeShop}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Stage-aware subtitle for the Live Display header. Prefixes the stage of the
 * specific duel being shown — so when the bronze (3rd place) match is active
 * during the final round, the audience reads "Disputa de 3º lugar · Rodada 3 de 3"
 * instead of the confusing "Final". Falls back to plain round counter for early
 * rounds.
 */
function duelSubtitle(
  duel: { round: number; isBronzeMatch?: boolean },
  currentRound: number | null,
  totalRounds: number,
): string {
  const round = currentRound ?? duel.round;
  const roundCounter = `Rodada ${round} de ${totalRounds}`;
  if (duel.isBronzeMatch) return `Disputa de 3º lugar · ${roundCounter}`;
  if (duel.round === totalRounds) return `Final · ${roundCounter}`;
  if (duel.round === totalRounds - 1) return `Semifinal · ${roundCounter}`;
  return roundCounter;
}

function miniCardLabel(duel: BracketDuel, totalRounds: number): string {
  if (duel.isBronzeMatch) return '3º lugar';
  if (duel.round === totalRounds) return 'Final';
  return `#${duel.position + 1}`;
}

function MiniBracketStrip({
  duels,
  activeDuelId,
  totalRounds,
}: {
  duels: BracketDuel[];
  activeDuelId: string;
  totalRounds: number;
}) {
  // Sort by play order: in the final round, bronze (3rd-place playoff) plays
  // BEFORE the grand final per standard tournament convention.
  const ordered = [...duels].sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    if (a.round === totalRounds) {
      if (a.isBronzeMatch && !b.isBronzeMatch) return -1;
      if (!a.isBronzeMatch && b.isBronzeMatch) return 1;
    }
    return a.position - b.position;
  });
  return (
    <div className="mt-12 w-full max-w-6xl">
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--crema-300)] text-center mb-3">
        Duelos da rodada
      </p>
      <div className="flex flex-wrap items-stretch justify-center gap-3">
        {ordered.map((d) => (
          <MiniBracketCard
            key={d.id}
            duel={d}
            isActive={d.id === activeDuelId}
            label={miniCardLabel(d, totalRounds)}
          />
        ))}
      </div>
    </div>
  );
}

function MiniBracketCard({ duel, isActive, label }: { duel: BracketDuel; isActive: boolean; label: string }) {
  const isCompleted = duel.status === 'completed' || duel.status === 'walkover';
  const winnerId = duel.winner?.id ?? null;

  const containerCls = isActive
    ? 'border-[var(--cinnamon-500)] bg-[var(--cinnamon-500)]/10'
    : isCompleted
      ? 'border-transparent bg-[var(--espresso-700)]'
      : 'border-[var(--espresso-500)] bg-transparent';

  return (
    <div
      className={`relative flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] border ${containerCls}`}
      style={{ minWidth: 260, maxWidth: 360 }}
    >
      <span className="font-mono tabular-nums text-[10px] md:text-xs text-[var(--crema-300)] absolute -top-2 left-3 bg-[var(--espresso-900)] px-1 rounded whitespace-nowrap">
        {label}
      </span>
      <MiniCompetitorRow entry={duel.entryA} isWinner={winnerId === duel.entryA?.id} />
      <div className="flex flex-col items-center justify-center px-1 flex-shrink-0">
        <span className="font-mono text-[10px] tracking-wider uppercase text-[var(--crema-300)]">×</span>
        {isCompleted && (
          <span className="font-mono tabular-nums text-xs md:text-sm font-semibold text-[var(--crema-50)] mt-0.5">
            {duel.votesA}–{duel.votesB}
          </span>
        )}
      </div>
      <MiniCompetitorRow entry={duel.entryB} isWinner={winnerId === duel.entryB?.id} />
    </div>
  );
}

function MiniCompetitorRow({ entry, isWinner }: { entry: Entry | null; isWinner: boolean }) {
  if (!entry) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0 opacity-50">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[var(--espresso-700)] border border-[var(--espresso-500)] flex-shrink-0" />
        <span className="font-display text-xs md:text-sm text-[var(--crema-300)] truncate" aria-label="Sem oponente">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <img
        src={entry.competitor.photoUrl}
        alt={entry.competitor.name}
        className={`w-8 h-8 md:w-9 md:h-9 rounded-full object-cover flex-shrink-0 border ${
          isWinner ? 'border-[var(--marigold-500)]' : 'border-[var(--crema-200)]'
        }`}
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span className={`font-display text-xs md:text-sm font-semibold truncate leading-tight ${
          isWinner ? 'text-[var(--crema-50)]' : 'text-[var(--crema-100)]'
        }`}>
          {entry.competitor.name}
        </span>
        <span className="font-serif italic text-[10px] md:text-xs text-[var(--crema-300)] truncate leading-tight">
          {entry.competitor.coffeeShop}
        </span>
      </div>
    </div>
  );
}

function PodiumSlot({
  entry,
  position,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}) {
  const isFirst = position === 1;
  const accent =
    position === 1
      ? 'var(--marigold-500)'
      : position === 2
        ? 'var(--crema-300)'
        : 'var(--cinnamon-500)';
  const photoSize = isFirst
    ? 'w-28 h-28 md:w-44 md:h-44'
    : position === 2
      ? 'w-24 h-24 md:w-36 md:h-36'
      : 'w-20 h-20 md:w-32 md:h-32';
  const blockHeight = isFirst ? 'py-8 md:py-10' : position === 2 ? 'py-6 md:py-8' : 'py-4 md:py-6';
  const slotWidth = isFirst ? 'max-w-[260px]' : 'max-w-[220px]';
  const positionNumberSize = isFirst ? 'text-5xl md:text-6xl' : position === 2 ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl';

  return (
    <div className={`flex flex-col items-center flex-1 ${slotWidth}`}>
      {/* Stamp-seal "VENCEDOR" badge for 1st place — espresso-on-crema, set on a light disk so it reads on dark bg */}
      {isFirst && (
        <div className="w-24 h-24 md:w-28 md:h-28 mb-2 -mr-6 self-end rounded-full bg-[var(--crema-50)] flex items-center justify-center shadow-[var(--shadow-1)]">
          <img
            src="/assets/stamp-seal.svg"
            alt="Campeão"
            className="w-[90%] h-[90%]"
          />
        </div>
      )}
      <div
        className={`relative ${photoSize} rounded-full overflow-hidden mb-4 shadow-[var(--shadow-2)]`}
        style={{ border: `${isFirst ? 6 : 4}px solid ${accent}` }}
      >
        <img
          src={entry.competitor.photoUrl}
          alt={entry.competitor.name}
          className="w-full h-full object-cover"
        />
        {isFirst && (
          <img
            src="/assets/trophy.svg"
            alt=""
            aria-hidden
            className="absolute -bottom-2 -right-2 w-12 h-12 bg-[var(--marigold-500)] rounded-full p-1.5 shadow-[var(--shadow-1)]"
          />
        )}
      </div>
      <p
        className={`${isFirst ? 'text-xl md:text-2xl' : 'text-base md:text-lg'} font-display font-bold text-center text-[var(--crema-50)]`}
      >
        {entry.competitor.name}
      </p>
      <p className="text-sm md:text-base font-serif italic text-[var(--crema-200)] text-center mt-1">
        {entry.competitor.coffeeShop}
      </p>
      <div
        className={`mt-4 w-full ${blockHeight} rounded-t-[var(--radius-sm)] flex items-center justify-center`}
        style={{ backgroundColor: accent }}
      >
        <span className={`${positionNumberSize} font-display font-bold text-[var(--espresso-900)] tabular-nums`}>
          {position}
        </span>
      </div>
    </div>
  );
}

function FlankSlot({ entry, position }: { entry: LeaderboardEntry; position: 4 | 5 }) {
  return (
    <div className="flex flex-col items-center flex-1 max-w-[170px] opacity-90 self-end">
      <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[var(--espresso-500)] mb-3">
        <img
          src={entry.competitor.photoUrl}
          alt={entry.competitor.name}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-sm md:text-base font-display font-bold text-center text-[var(--crema-50)]">
        {entry.competitor.name}
      </p>
      <p className="text-xs md:text-sm font-serif italic text-[var(--crema-200)] text-center mt-0.5 line-clamp-1">
        {entry.competitor.coffeeShop}
      </p>
      <div className="mt-3 w-full py-2 md:py-3 rounded-t-[var(--radius-sm)] bg-[var(--espresso-700)] flex items-center justify-center">
        <span className="text-xl md:text-2xl font-display font-bold text-[var(--crema-100)] tabular-nums">
          {position}
        </span>
      </div>
    </div>
  );
}
