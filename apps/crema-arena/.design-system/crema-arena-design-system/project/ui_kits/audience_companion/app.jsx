// Audience Companion — app.jsx
// Public mobile view at /e/[eventId]. State is locally faked so the tabs and
// the round history all reflect a single coherent running event.

const EVENT = {
  name: 'TNT Casa do Lucas',
  dateLabel: '20 de maio',
  location: 'Casa do Lucas · SP',
  judgesCount: 3,
};

const COMPETITORS = {
  lc: { initials: 'LC', name: 'Lucas',         shop: 'Independente' },
  km: { initials: 'KM', name: 'Kamys',         shop: 'Estação I4'   },
  jm: { initials: 'JM', name: 'Ju Morgado',    shop: 'Três'         },
  pb: { initials: 'PB', name: 'Pequeno Bambu', shop: 'Muy'          },
  gb: { initials: 'GB', name: 'Gabs',          shop: 'Muy'          },
  mo: { initials: 'MO', name: 'Marina Okada',  shop: 'Coffee Lab'   },
  tl: { initials: 'TL', name: 'Tom Lemos',     shop: 'Onça Café'    },
  sr: { initials: 'SR', name: 'Sofia Rocha',   shop: 'Coffee Town'  },
};

// Current duel — Lucas vs Kamys, 2 × 1 mid-vote
const CURRENT_DUEL = {
  id: 'd-now', position: 1, roundLabel: 'Semifinal',
  entryA: COMPETITORS.lc, entryB: COMPETITORS.km,
  votesA: 2, votesB: 1,
};

// Round history for AoVivo tab
const ROUND_DUELS = [
  { id: 'r2-1', position: 1, state: 'completed', entryA: COMPETITORS.jm, entryB: COMPETITORS.sr, votesA: 3, votesB: 0, winner: 'A', isWO: false },
  { id: 'r2-2', position: 2, state: 'pending',   entryA: COMPETITORS.pb, entryB: COMPETITORS.gb, votesA: 0, votesB: 0, winner: null },
];

// Full bracket for Chave tab
const ROUNDS = [
  {
    id: 'r1', label: 'Quartas',
    duels: [
      { id: 'q1', position: 1, status: 'completed', entryA: COMPETITORS.lc, entryB: COMPETITORS.tl, votesA: 3, votesB: 0, winner: 'A' },
      { id: 'q2', position: 2, status: 'completed', entryA: COMPETITORS.km, entryB: COMPETITORS.mo, votesA: 2, votesB: 1, winner: 'A' },
      { id: 'q3', position: 3, status: 'completed', entryA: COMPETITORS.jm, entryB: COMPETITORS.sr, votesA: 3, votesB: 0, winner: 'A' },
      { id: 'q4', position: 4, status: 'walkover',  entryA: COMPETITORS.pb, entryB: null,           votesA: 0, votesB: 0, winner: 'A' },
    ],
  },
  {
    id: 'r2', label: 'Semifinal',
    duels: [
      { id: 'sf1', position: 1, status: 'in_progress', entryA: COMPETITORS.lc, entryB: COMPETITORS.km, votesA: 2, votesB: 1, winner: null },
      { id: 'sf2', position: 2, status: 'pending',     entryA: COMPETITORS.jm, entryB: COMPETITORS.pb, votesA: 0, votesB: 0, winner: null },
    ],
  },
  {
    id: 'r3', label: 'Final',
    duels: [
      { id: 'f1', position: 1, status: 'pending', entryA: null, entryB: null, votesA: 0, votesB: 0, winner: null },
    ],
  },
];

const LEADERBOARD = [
  { id: 'l-lc', position: 1, initials: 'LC', name: 'Lucas',         shop: 'Independente', wins: 2, votes: 5 },
  { id: 'l-km', position: 2, initials: 'KM', name: 'Kamys',         shop: 'Estação I4',   wins: 1, votes: 3 },
  { id: 'l-jm', position: 3, initials: 'JM', name: 'Ju Morgado',    shop: 'Três',         wins: 1, votes: 3 },
  { id: 'l-pb', position: 4, initials: 'PB', name: 'Pequeno Bambu', shop: 'Muy',          wins: 0, votes: 0 },
  { id: 'l-tl', position: 5, initials: 'TL', name: 'Tom Lemos',     shop: 'Onça Café',    wins: 0, votes: 0 },
];

const APP_STATUS = 'running'; // 'setup' | 'running' | 'finished'

function App() {
  const [tab, setTab] = React.useState('ao-vivo');

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header event={EVENT} status={APP_STATUS} active={tab} onChange={setTab} />
      <main style={{ flex: 1, paddingBottom: 40 }}>
        {tab === 'ao-vivo'     && <AoVivoTab event={EVENT} currentDuel={CURRENT_DUEL} roundDuels={ROUND_DUELS} />}
        {tab === 'chave'       && <ChaveTab rounds={ROUNDS} activeDuelId="sf1" />}
        {tab === 'leaderboard' && <LeaderboardTab leaderboard={LEADERBOARD} />}
      </main>
    </div>
  );
}

window.App = App;
