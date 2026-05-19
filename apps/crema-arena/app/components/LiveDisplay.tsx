'use client';

import useSWR from 'swr';

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
  // 5s polling per spec — keep all three keys on the same cadence.
  const swrOpts = { refreshInterval: 5000, revalidateOnFocus: false };
  const { data, error } = useSWR<CurrentDuelData>(`/api/events/${eventId}/current-duel`, fetcher, swrOpts);
  const { data: bracketData } = useSWR<BracketData>(`/api/events/${eventId}/bracket`, fetcher, swrOpts);
  const { data: leaderboard } = useSWR<LeaderboardData>(`/api/events/${eventId}/leaderboard`, tolerantFetcher, swrOpts);
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
    const roundLabel =
      currentRound === totalRounds
        ? 'Final'
        : currentRound === totalRounds - 1
          ? 'Semifinal'
          : `Rodada ${currentRound} de ${totalRounds}`;
    const currentRoundDuels = bracketData
      ? bracketData.duels.filter((d) => d.round === currentRound)
      : [];
    const hasPour = !!currentDuel.pourPhotoUrl;

    return (
      <div className="min-h-screen bg-[var(--espresso-900)] flex flex-col relative overflow-hidden">
        {/* Top bar: AO VIVO + title */}
        <header className="flex items-start justify-between p-6 md:p-10 lg:p-12">
          <LiveBadge />
          <div className="text-center flex-1 px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-[var(--crema-50)] leading-tight">
              {event.name}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-serif italic text-[var(--crema-200)] mt-1">
              {roundLabel}
            </p>
          </div>
          <div className="w-[88px] md:w-[110px]" aria-hidden /> {/* spacer to balance LiveBadge */}
        </header>

        {/* Main area */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-10 lg:px-16 pb-40" role="main" aria-live="polite">
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

          {/* Mini bracket strip for current round */}
          {currentRoundDuels.length > 1 && (
            <MiniBracketStrip duels={currentRoundDuels} activeDuelId={currentDuel.id} />
          )}
        </main>

        {/* QR — bottom-right */}
        <QrBadge eventId={eventId} />
      </div>
    );
  }

  // Running between duels - show next matchup
  if (nextDuel && nextDuel.entryA && nextDuel.entryB) {
    return (
      <div className="min-h-screen bg-[var(--espresso-900)] flex flex-col relative">
        <header className="flex items-start justify-between p-6 md:p-10 lg:p-12">
          <LiveBadge />
          <div className="text-center flex-1 px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-[var(--crema-50)] leading-tight">
              {event.name}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-serif italic text-[var(--crema-200)] mt-1">
              Rodada {currentRound} de {totalRounds}
            </p>
          </div>
          <div className="w-[88px] md:w-[110px]" aria-hidden />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-8 pb-40">
          <p className="text-2xl md:text-3xl font-serif italic text-[var(--marigold-500)] mb-8">
            A seguir
          </p>
          <div className="p-10 md:p-14 bg-[var(--espresso-700)] rounded-[var(--radius-lg)] shadow-[var(--shadow-2)] text-center max-w-4xl">
            <p className="text-3xl md:text-4xl font-display font-bold text-[var(--crema-50)]">
              {nextDuel.entryA.competitor.name}
            </p>
            <p className="text-xl md:text-2xl font-serif italic text-[var(--crema-200)] mt-1">
              {nextDuel.entryA.competitor.coffee_shop}
            </p>
            <p className="text-3xl md:text-4xl font-mono font-semibold text-[var(--marigold-500)] tabular-nums my-6">
              VS
            </p>
            <p className="text-3xl md:text-4xl font-display font-bold text-[var(--crema-50)]">
              {nextDuel.entryB.competitor.name}
            </p>
            <p className="text-xl md:text-2xl font-serif italic text-[var(--crema-200)] mt-1">
              {nextDuel.entryB.competitor.coffee_shop}
            </p>
          </div>
        </main>

        <QrBadge eventId={eventId} />
      </div>
    );
  }

  // Default running state (no active or next duel)
  return (
    <div className="min-h-screen bg-[var(--espresso-900)] flex flex-col relative">
      <header className="flex items-start justify-between p-6 md:p-10 lg:p-12">
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
      <span className="w-2 h-2 rounded-full bg-[var(--live)]" aria-hidden />
      <span className="font-mono text-xs md:text-sm font-semibold tracking-wider uppercase">
        Ao vivo
      </span>
    </div>
  );
}

function QrBadge({ eventId }: { eventId: string }) {
  return (
    <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex items-center gap-3 bg-[var(--crema-50)] rounded-[var(--radius-md)] p-3 md:p-4 shadow-[var(--shadow-2)]">
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

function CompetitorBlock({ competitor, side }: { competitor: Competitor; side: 'A' | 'B' }) {
  return (
    <div className="flex flex-col items-center text-center max-w-md flex-1">
      <div className="w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 rounded-full overflow-hidden border-4 border-[var(--crema-200)] shadow-[var(--shadow-2)] mb-5">
        <img src={competitor.photo_url} alt={competitor.name} className="w-full h-full object-cover" />
      </div>
      <p className="font-mono text-xs md:text-sm tracking-wider uppercase text-[var(--crema-300)] mb-2">
        Copa {side}
      </p>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-[var(--crema-50)] leading-tight">
        {competitor.name}
      </h2>
      <p className="text-lg md:text-xl lg:text-2xl font-serif italic text-[var(--crema-200)] mt-2">
        {competitor.coffee_shop}
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
  return (
    <div className="relative w-full max-w-5xl rounded-[var(--radius-lg)] overflow-hidden border-4 border-[var(--crema-200)] shadow-[var(--shadow-2)]">
      <img
        src={pourPhotoUrl}
        alt="Foto dos copos servidos"
        className="w-full h-auto max-h-[70vh] object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--espresso-900)]/95 via-[var(--espresso-900)]/70 to-transparent p-6 md:p-10">
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs md:text-sm uppercase tracking-wider text-[var(--crema-300)]">
              Copa A
            </p>
            <p className="text-2xl md:text-4xl font-display font-bold text-[var(--crema-50)] truncate">
              {entryA.competitor.name}
            </p>
            <p className="text-base md:text-xl font-serif italic text-[var(--crema-200)] truncate">
              {entryA.competitor.coffee_shop}
            </p>
          </div>

          <div
            className="font-mono font-semibold text-[var(--crema-50)] tabular-nums flex-shrink-0 leading-none"
            style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}
            aria-label={`Placar atual: ${votesA} a ${votesB}`}
          >
            {votesA} × {votesB}
          </div>

          <div className="flex-1 min-w-0 text-right">
            <p className="font-mono text-xs md:text-sm uppercase tracking-wider text-[var(--crema-300)]">
              Copa B
            </p>
            <p className="text-2xl md:text-4xl font-display font-bold text-[var(--crema-50)] truncate">
              {entryB.competitor.name}
            </p>
            <p className="text-base md:text-xl font-serif italic text-[var(--crema-200)] truncate">
              {entryB.competitor.coffee_shop}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBracketStrip({
  duels,
  activeDuelId,
}: {
  duels: BracketDuel[];
  activeDuelId: string;
}) {
  return (
    <div className="mt-12 w-full max-w-5xl">
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--crema-300)] text-center mb-3">
        Duelos da rodada
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {duels.map((d) => {
          const isActive = d.id === activeDuelId;
          const isCompleted = d.status === 'completed' || d.status === 'walkover';
          const nameA = d.entryA?.competitor.name ?? 'Bye';
          const nameB = d.entryB?.competitor.name ?? 'Bye';
          return (
            <div
              key={d.id}
              className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs md:text-sm font-display border ${
                isActive
                  ? 'border-[var(--cinnamon-500)] bg-[var(--cinnamon-500)]/10 text-[var(--crema-50)]'
                  : isCompleted
                    ? 'border-transparent bg-[var(--espresso-700)] text-[var(--crema-200)]'
                    : 'border-[var(--espresso-500)] text-[var(--crema-300)]'
              }`}
            >
              <span className="font-mono tabular-nums mr-2 text-[var(--crema-300)]">
                #{d.position + 1}
              </span>
              <span className="truncate">{nameA}</span>
              <span className="mx-2 text-[var(--crema-300)]">×</span>
              <span className="truncate">{nameB}</span>
              {isCompleted && (
                <span className="ml-2 font-mono tabular-nums text-[var(--crema-100)]">
                  {d.votesA}–{d.votesB}
                </span>
              )}
            </div>
          );
        })}
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
      {/* Stamp-seal "VENCEDOR" badge for 1st place */}
      {isFirst && (
        <img
          src="/assets/stamp-seal.svg"
          alt="Campeão"
          className="w-24 h-24 md:w-28 md:h-28 mb-2 -mr-6 self-end"
        />
      )}
      <div
        className={`relative ${photoSize} rounded-full overflow-hidden mb-4 shadow-[var(--shadow-2)]`}
        style={{ border: `${isFirst ? 6 : 4}px solid ${accent}` }}
      >
        <img
          src={entry.competitor.photo_url}
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
        {entry.competitor.coffee_shop}
      </p>
      <p className="font-mono text-xs md:text-sm tabular-nums text-[var(--crema-300)] mt-2">
        {entry.wins} {entry.wins === 1 ? 'vitória' : 'vitórias'} · {entry.totalVotesReceived}{' '}
        {entry.totalVotesReceived === 1 ? 'voto' : 'votos'}
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
          src={entry.competitor.photo_url}
          alt={entry.competitor.name}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-sm md:text-base font-display font-bold text-center text-[var(--crema-50)]">
        {entry.competitor.name}
      </p>
      <p className="text-xs md:text-sm font-serif italic text-[var(--crema-200)] text-center mt-0.5 line-clamp-1">
        {entry.competitor.coffee_shop}
      </p>
      <p className="font-mono text-[10px] md:text-xs tabular-nums text-[var(--crema-300)] mt-1">
        {entry.wins} {entry.wins === 1 ? 'vitória' : 'vitórias'} · {entry.totalVotesReceived}{' '}
        {entry.totalVotesReceived === 1 ? 'voto' : 'votos'}
      </p>
      <div className="mt-3 w-full py-2 md:py-3 rounded-t-[var(--radius-sm)] bg-[var(--espresso-700)] flex items-center justify-center">
        <span className="text-xl md:text-2xl font-display font-bold text-[var(--crema-100)] tabular-nums">
          {position}
        </span>
      </div>
    </div>
  );
}
