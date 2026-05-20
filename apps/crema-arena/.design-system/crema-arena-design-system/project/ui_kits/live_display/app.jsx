// Live Display — app.jsx
// 1920×1080 espresso stage. The header carries an AO VIVO pill, the event
// name + round label, and a duel timer. The main area is the profile-card
// centerpiece + central N × M score, with the mini-bracket strip across the
// bottom. QR badge sits anchored to the bottom-right of the viewport.

const COMP = {
  lc: { initials: 'LC', name: 'Lucas',         shop: 'Independente' },
  km: { initials: 'KM', name: 'Kamys',         shop: 'Estação I4'   },
  jm: { initials: 'JM', name: 'Ju Morgado',    shop: 'Três'         },
  pb: { initials: 'PB', name: 'Pequeno Bambu', shop: 'Muy'          },
};

const EVENT = { name: 'TNT Casa do Lucas' };

const CURRENT = {
  id: 'sf1',
  entryA: COMP.lc, entryB: COMP.km,
  votesA: 2, votesB: 1,
};

const ROUND_DUELS = [
  { id: 'sf1', status: 'in_progress', entryA: COMP.lc, entryB: COMP.km, votesA: 2, votesB: 1, winner: null },
  { id: 'sf2', status: 'pending',     entryA: COMP.jm, entryB: COMP.pb, votesA: 0, votesB: 0, winner: null },
];

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function App() {
  // Live timer for the duel — counts up from a fake start moment, like the
  // real DuelTimer reading `startedAt` from the API.
  const [startMs] = React.useState(() => Date.now() - 47_000); // started 47s ago
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const timerDisplay = formatElapsed(Math.max(0, now - startMs));

  useLucide([]);

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', flexDirection: 'column',
      background: LD.espresso, color: LD.cremaLight,
      overflow: 'hidden',
    }}>
      <StageHeader event={EVENT} roundLabel="Semifinal · Rodada 2 de 3" timer={timerDisplay} />

      <main style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 64px 200px', gap: 64,
      }}>
        <ProfileCardsCenterpiece duel={CURRENT} />
        <MiniBracketStrip duels={ROUND_DUELS} activeDuelId={CURRENT.id} />
      </main>

      <QrBadge url="crema.app/e/casa-lucas" />
    </div>
  );
}

window.App = App;
