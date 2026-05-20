// Live Display — components.jsx
// 1920×1080 TV stage mirroring app/components/LiveDisplay.tsx. Espresso bg.
// Central score in mono, profile-card centerpiece, mini-bracket strip across
// the bottom, QR badge anchored to the bottom-right.

const LD = {
  espresso: 'var(--espresso-900)', espresso700: 'var(--espresso-700)',
  espresso500: 'var(--espresso-500)',
  cremaLight: 'var(--crema-50)', cremaMid: 'var(--crema-100)',
  cremaSoft: 'var(--crema-200)', cremaDim: 'var(--crema-300)',
  brand: 'var(--brand)',
  marigold: 'var(--marigold-500)', marigold300: 'var(--marigold-300)',
  live: 'var(--live)', liveSoft: 'var(--live-soft)', mint100: 'var(--mint-100)',
  fg: 'var(--fg)',
  fD: 'var(--font-display)', fB: 'var(--font-body)',
  fM: 'var(--font-mono)', fS: 'var(--font-serif)',
};

function useLucide(deps) {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, deps);
}

// ───────── Live badge ─────────
function LiveBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '8px 18px', borderRadius: 999,
      background: LD.liveSoft, color: LD.live, flexShrink: 0,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 12, height: 12, borderRadius: 999, background: LD.live, flexShrink: 0 }} />
      <span style={{ fontFamily: LD.fM, fontSize: 18, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' }}>
        Ao vivo
      </span>
    </div>
  );
}

function DuelTimer({ display }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span style={{ fontFamily: LD.fM, fontSize: 13, fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: LD.cremaDim }}>Tempo</span>
      <span style={{ fontFamily: LD.fM, fontSize: 44, fontWeight: 600, color: LD.cremaLight, lineHeight: 1, marginTop: 4, fontFeatureSettings: '"tnum"' }}>{display}</span>
    </div>
  );
}

// ───────── Header ─────────
function StageHeader({ event, roundLabel, timer }) {
  return (
    <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '40px 56px 0', flexShrink: 0 }}>
      <LiveBadge />
      <div style={{ textAlign: 'center', flex: 1, padding: '0 24px' }}>
        <h1 style={{ margin: 0, fontFamily: LD.fD, fontWeight: 700, fontSize: 56, color: LD.cremaLight, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{event.name}</h1>
        <p style={{ margin: '6px 0 0', fontFamily: LD.fS, fontStyle: 'italic', fontSize: 28, color: LD.cremaSoft }}>{roundLabel}</p>
      </div>
      <DuelTimer display={timer} />
    </header>
  );
}

// ───────── Centerpiece: profile cards + central score ─────────
function CompetitorBlock({ competitor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, maxWidth: 480 }}>
      <div style={{
        width: 256, height: 256, borderRadius: 999, overflow: 'hidden',
        border: `4px solid ${LD.cremaSoft}`,
        boxShadow: 'var(--shadow-2)',
        background: LD.espresso700, color: LD.cremaMid,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: LD.fD, fontWeight: 700, fontSize: 88, marginBottom: 28,
      }}>{competitor.initials}</div>
      <h2 style={{ margin: 0, fontFamily: LD.fD, fontWeight: 700, fontSize: 56, color: LD.cremaLight, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{competitor.name}</h2>
      <p style={{ margin: '12px 0 0', fontFamily: LD.fS, fontStyle: 'italic', fontSize: 28, color: LD.cremaSoft }}>{competitor.shop}</p>
    </div>
  );
}

function CentralScore({ a, b }) {
  return (
    <div style={{
      fontFamily: LD.fM, fontWeight: 600, fontSize: 96, color: LD.cremaLight,
      lineHeight: 1, flexShrink: 0, fontFeatureSettings: '"tnum"', letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
    }} aria-label={`Placar: ${a} a ${b}`}>{a} × {b}</div>
  );
}

function ProfileCardsCenterpiece({ duel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80, width: '100%', maxWidth: 1800 }}>
      <CompetitorBlock competitor={duel.entryA} />
      <CentralScore a={duel.votesA} b={duel.votesB} />
      <CompetitorBlock competitor={duel.entryB} />
    </div>
  );
}

// ───────── Mini bracket strip ─────────
function MiniCompetitorRow({ entry, winner }) {
  if (!entry) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, opacity: 0.5 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: LD.espresso700, border: `1px solid ${LD.espresso500}`, flexShrink: 0 }} />
        <span style={{ fontFamily: LD.fD, fontSize: 14, color: LD.cremaDim }}>—</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 999, flexShrink: 0,
        background: LD.espresso700, color: LD.cremaMid,
        border: `1px solid ${winner ? LD.marigold : LD.cremaSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: LD.fD, fontWeight: 700, fontSize: 13,
      }}>{entry.initials}</div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: 1 }}>
        <span style={{ fontFamily: LD.fD, fontWeight: 600, fontSize: 14,
          color: winner ? LD.cremaLight : LD.cremaMid,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1 }}>{entry.name}</span>
        <span style={{ fontFamily: LD.fS, fontStyle: 'italic', fontSize: 12, color: LD.cremaDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1 }}>{entry.shop}</span>
      </div>
    </div>
  );
}

function MiniCard({ duel, isActive, label }) {
  const isDone = duel.status === 'completed' || duel.status === 'walkover';
  const containerStyle = isActive
    ? { borderColor: LD.brand, background: 'rgba(196,90,44,.10)' }
    : isDone
      ? { borderColor: 'transparent', background: LD.espresso700 }
      : { borderColor: LD.espresso500, background: 'transparent' };
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
      minWidth: 300, maxWidth: 360,
      padding: '12px 14px',
      border: '1px solid',
      borderRadius: 'var(--radius-md)',
      ...containerStyle,
    }}>
      <span style={{
        position: 'absolute', top: -10, left: 16,
        background: LD.espresso, color: LD.cremaDim,
        fontFamily: LD.fM, fontSize: 11, padding: '0 6px', whiteSpace: 'nowrap',
      }}>{label}</span>
      <MiniCompetitorRow entry={duel.entryA} winner={duel.winner === 'A'} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontFamily: LD.fM, fontSize: 11, color: LD.cremaDim, letterSpacing: '.1em', textTransform: 'uppercase' }}>×</span>
        {isDone && (
          <span style={{ fontFamily: LD.fM, fontSize: 14, fontWeight: 600, color: LD.cremaLight, marginTop: 2, fontFeatureSettings: '"tnum"', whiteSpace: 'nowrap' }}>
            {duel.votesA}–{duel.votesB}
          </span>
        )}
      </div>
      <MiniCompetitorRow entry={duel.entryB} winner={duel.winner === 'B'} />
    </div>
  );
}

function MiniBracketStrip({ duels, activeDuelId, label = 'Duelos da rodada' }) {
  return (
    <div style={{ width: '100%', maxWidth: 1600 }}>
      <p style={{ margin: '0 0 14px', textAlign: 'center', fontFamily: LD.fM, fontSize: 14, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: LD.cremaDim }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        {duels.map((d, i) => <MiniCard key={d.id} duel={d} isActive={d.id === activeDuelId} label={`#${i + 1}`} />)}
      </div>
    </div>
  );
}

// ───────── QR badge ─────────
function QrBadge({ url = 'crema.app/e/tnt' }) {
  return (
    <div style={{
      position: 'absolute', bottom: 32, right: 40, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 16,
      background: LD.cremaLight, borderRadius: 'var(--radius-md)',
      padding: 16, boxShadow: 'var(--shadow-2)',
    }}>
      <div style={{
        width: 128, height: 128,
        background: 'repeating-conic-gradient(var(--espresso-900) 0deg 10deg, transparent 10deg 20deg)',
        backgroundSize: '16px 16px', backgroundColor: '#fff',
        borderRadius: 6, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32, background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: LD.espresso, fontFamily: LD.fD, fontWeight: 800, fontSize: 11,
        }}>QR</div>
      </div>
      <div style={{ maxWidth: 180 }}>
        <p style={{ margin: 0, fontFamily: LD.fD, fontWeight: 600, fontSize: 18, color: LD.fg, lineHeight: 1.15 }}>
          Acompanhe pelo celular
        </p>
        <p style={{ margin: '4px 0 0', fontFamily: LD.fM, fontSize: 12, color: 'var(--fg-3)' }}>{url}</p>
      </div>
    </div>
  );
}

Object.assign(window, {
  LD, useLucide,
  LiveBadge, DuelTimer, StageHeader,
  CompetitorBlock, CentralScore, ProfileCardsCenterpiece,
  MiniCompetitorRow, MiniCard, MiniBracketStrip, QrBadge,
});
