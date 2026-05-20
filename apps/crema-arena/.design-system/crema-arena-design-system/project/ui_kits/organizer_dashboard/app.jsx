// Organizer Dashboard — app.jsx
// Assembles the /dashboard/events/[id] running surface: sidebar + running top
// bar + stat strip + now-pouring hero + tap-to-tally captures + bracket below.

const COMP = {
  lc: { initials: 'LC', name: 'Lucas',         shop: 'Independente' },
  km: { initials: 'KM', name: 'Kamys',         shop: 'Estação I4'   },
  jm: { initials: 'JM', name: 'Ju Morgado',    shop: 'Três'         },
  pb: { initials: 'PB', name: 'Pequeno Bambu', shop: 'Muy'          },
  gb: { initials: 'GB', name: 'Gabs',          shop: 'Muy'          },
  mo: { initials: 'MO', name: 'Marina Okada',  shop: 'Coffee Lab'   },
  tl: { initials: 'TL', name: 'Tom Lemos',     shop: 'Onça Café'    },
  sr: { initials: 'SR', name: 'Sofia Rocha',   shop: 'Coffee Town'  },
};

const EVENT = {
  name: 'TNT Casa do Lucas',
  dateLabel: 'Qua 20 mai · 19h',
  location: 'Casa do Lucas · SP',
  judgesCount: 3,
  roundLabel: 'Semifinal',
  completedInRound: 0,
  totalInRound: 2,
};

const STATS = [
  { label: 'Na chave',  value: '8', sub: '8 confirmados' },
  { label: 'Baterias',  value: '5', valueSecondary: '/ 7', sub: 'Rodada 2 · 50% concluída', accent: 'var(--cinnamon-600)' },
  { label: 'Unânimes',  value: '3', sub: 'duelos 3 × 0' },
  { label: 'Próxima',   value: 'Pronto', sub: 'Bateria 2 · Ju × Bambu', accent: 'var(--mint-700)' },
];

const CURRENT = {
  position: 1, roundLabel: 'Semifinal',
  entryA: COMP.lc, entryB: COMP.km,
  votesA: 2, votesB: 1,
};

const ROUNDS = {
  semifinal: [
    { id: 'sf1', position: 1, status: 'in_progress', entryA: COMP.lc, entryB: COMP.km, votesA: 2, votesB: 1, winner: null },
    { id: 'sf2', position: 2, status: 'pending',     entryA: COMP.jm, entryB: COMP.pb, votesA: 0, votesB: 0, winner: null },
  ],
  final: [
    { id: 'f1',  position: 1, status: 'pending', entryA: null, entryB: null, votesA: 0, votesB: 0, winner: null },
  ],
};

const USER = { name: 'Julia Ramos', email: 'julia@crema-arena.com', role: 'admin' };

function App() {
  const [active, setActive] = React.useState('events');
  useLucide([active]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', minHeight: '100vh', background: DT.bg }}>
      <Sidebar active={active} onChange={setActive} user={USER} />

      <main style={{ padding: '28px 32px 64px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1280, width: '100%', boxSizing: 'border-box' }}>
        {/* Breadcrumb-ish back link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: DT.fg3 }}>
          <span>Eventos</span>
          <span>/</span>
          <span style={{ color: DT.fg2, fontWeight: 500 }}>TNT Casa do Lucas</span>
        </div>

        <RunningTopBar event={EVENT} primaryAction={
          <Button variant="secondary" size="md">
            <Icon name="external-link" size={16} />
            Abrir tela ao vivo
          </Button>
        } />

        <EventStatStrip stats={STATS} />

        <NowPouring duel={CURRENT} judgesCount={EVENT.judgesCount} />

        {/* Two-column: vote capture on the left, current round bracket on the right */}
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          <TapToTally duel={CURRENT} judgesCount={EVENT.judgesCount} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: DT.raised, border: `1px solid ${DT.border}`,
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-1)',
              padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontFamily: DT.fD, fontWeight: 700, fontSize: 18, color: DT.fg }}>Chave</h3>
                <span style={{ fontSize: 13, color: DT.fg3 }}>Rodada 2 de 3</span>
              </div>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
                <BracketColumn label="Semifinal" count={ROUNDS.semifinal.length} duels={ROUNDS.semifinal} activeDuelId="sf1" />
                <BracketColumn label="Final"     count={ROUNDS.final.length}     duels={ROUNDS.final}     activeDuelId={null} />
              </div>
            </div>

            <div style={{
              background: DT.raised, border: `1px solid ${DT.border}`,
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-1)',
              padding: 18, display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 72, height: 72, background: DT.bg, borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: DT.fg3, fontFamily: DT.fM, fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase',
              }}>[QR]</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DT.fD, fontWeight: 700, fontSize: 14, color: DT.fg }}>Plateia acompanha pelo celular</div>
                <div style={{ marginTop: 2, fontSize: 12, color: DT.fg3 }}>crema.app/e/tnt-casa-do-lucas</div>
              </div>
              <Button variant="secondary" size="sm">Copiar link</Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

window.App = App;
