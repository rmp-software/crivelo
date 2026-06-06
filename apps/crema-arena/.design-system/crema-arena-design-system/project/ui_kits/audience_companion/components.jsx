// Audience Companion — components.jsx
// Mirrors /e/[eventId] in the production app: a sticky-header + 3-tab mobile
// view the audience opens after scanning the QR at the bar.

const ACT = {
  fg: 'var(--fg)', fg2: 'var(--fg-2)', fg3: 'var(--fg-3)', fg4: 'var(--fg-4)',
  bg: 'var(--bg)', bg2: 'var(--bg-2)', bg3: 'var(--bg-3)',
  surface: 'var(--surface)', raised: 'var(--surface-raised)',
  border: 'var(--border)', borderStrong: 'var(--border-strong)',
  brand: 'var(--brand)', brandSoft: 'var(--brand-soft)',
  gold: 'var(--gold)', goldSoft: 'var(--gold-soft)',
  live: 'var(--live)', liveSoft: 'var(--live-soft)',
  espresso: 'var(--espresso-900)',
  marigold: 'var(--marigold-500)',
  fD: 'var(--font-display)', fB: 'var(--font-body)',
  fM: 'var(--font-mono)', fS: 'var(--font-serif)',
};

// ───────── Avatar (initials disc — no external images) ─────────
function Avatar({ initials, size = 40, border = ACT.border, borderWidth = 2 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      background: ACT.bg2, border: `${borderWidth}px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: ACT.fg3, fontFamily: ACT.fD, fontWeight: 700,
      fontSize: Math.round(size * 0.36),
    }}>{initials}</div>
  );
}

// ───────── Badge (pill) ─────────
function Badge({ variant = 'default', children }) {
  const variants = {
    default: { bg: ACT.bg3, fg: ACT.fg2 },
    success: { bg: ACT.liveSoft, fg: ACT.live },
    warning: { bg: ACT.goldSoft, fg: ACT.gold },
  };
  const v = variants[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 10px', borderRadius: 999,
      background: v.bg, color: v.fg,
      fontFamily: ACT.fM, fontSize: 10, fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// ───────── Sticky header with event title + status + tabs ─────────
function Header({ event, status, active, onChange }) {
  const tabs = status === 'running'
    ? [['ao-vivo', 'Ao vivo'], ['chave', 'Chave']]
    : status === 'finished'
      ? [['chave', 'Chave'], ['leaderboard', 'Classificação']]
      : [['chave', 'Chave']];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 5,
      background: ACT.raised,
      borderBottom: `1px solid ${ACT.border}`,
      boxShadow: 'var(--shadow-1)',
      padding: '60px 16px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{
            fontFamily: ACT.fD, fontWeight: 700, fontSize: 18,
            color: ACT.fg, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{event.name}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: ACT.fg3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {event.dateLabel}{event.location ? ` · ${event.location}` : ''}
          </p>
        </div>
        {status === 'running' && <span style={{ flexShrink: 0 }}><Badge variant="success"><span style={{ width: 6, height: 6, borderRadius: 999, background: ACT.live, display: 'inline-block' }} />Ao vivo</Badge></span>}
        {status === 'finished' && <span style={{ flexShrink: 0 }}><Badge>Encerrado</Badge></span>}
        {status === 'setup' && <span style={{ flexShrink: 0 }}><Badge>Em preparação</Badge></span>}
      </div>

      <nav role="tablist" style={{
        display: 'flex', gap: 4, padding: 4,
        background: ACT.bg2, borderRadius: 'var(--radius-sm)',
      }}>
        {tabs.map(([id, label]) => {
          const on = active === id;
          return (
            <button key={id} role="tab" aria-selected={on} onClick={() => onChange(id)} style={{
              flex: 1, minHeight: 40, border: 'none', cursor: 'pointer',
              borderRadius: 'var(--radius-xs)',
              background: on ? ACT.raised : 'transparent',
              boxShadow: on ? 'var(--shadow-1)' : 'none',
              color: on ? ACT.fg : ACT.fg3,
              fontFamily: ACT.fB, fontWeight: 600, fontSize: 13,
              transition: 'background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard)',
            }}>{label}</button>
          );
        })}
      </nav>
    </header>
  );
}

// ───────── Ao vivo: current duel hero + round history ─────────
function AoVivoCurrentDuel({ duel, judgesCount }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: ACT.live, flexShrink: 0 }} />
        <span style={{ fontFamily: ACT.fM, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACT.live, whiteSpace: 'nowrap' }}>Ao vivo</span>
        <span style={{ color: ACT.fg3 }}>·</span>
        <span style={{ fontSize: 11, color: ACT.fg3, whiteSpace: 'nowrap' }}>{duel.roundLabel} · Duelo {duel.position}</span>
      </div>

      <div style={{
        background: ACT.raised,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: `2px solid ${ACT.live}`,
        boxShadow: 'var(--shadow-2)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: ACT.border, gap: 1 }}>
          {[duel.entryA, duel.entryB].map((e, i) => (
            <div key={i} style={{ background: ACT.surface, padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Avatar initials={e.initials} size={64} border={ACT.border} />
              <div style={{ fontFamily: ACT.fB, fontWeight: 600, fontSize: 13, color: ACT.fg, lineHeight: 1.2 }}>{e.name}</div>
              <div style={{ fontFamily: ACT.fS, fontStyle: 'italic', fontSize: 11, color: ACT.fg3 }}>{e.shop}</div>
            </div>
          ))}
        </div>

        <div style={{ background: ACT.bg2, borderTop: `1px solid ${ACT.border}`, padding: '14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {[duel.votesA, duel.votesB].map((v, i) => (
              <React.Fragment key={i}>
                {i === 1 && <span style={{ fontFamily: ACT.fM, color: ACT.fg3, fontSize: 18 }}>×</span>}
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-sm)',
                  background: ACT.raised, border: `1px solid ${ACT.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: ACT.fM, fontWeight: 600, fontSize: 22, color: ACT.fg,
                  fontFeatureSettings: '"tnum"',
                }}>{v}</div>
              </React.Fragment>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: ACT.fg3 }}>
            {duel.votesA + duel.votesB} de {judgesCount} votos
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactDuelRow({ duel }) {
  const isPending = duel.state === 'pending';
  return (
    <div style={{
      padding: 12, borderRadius: 'var(--radius-sm)',
      border: `1px solid ${ACT.border}`,
      background: isPending ? ACT.bg2 : ACT.surface,
      opacity: isPending ? 0.85 : 1,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: ACT.fM, fontSize: 10, fontWeight: 600, color: ACT.fg3, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Duelo {duel.position} · {isPending ? 'Pendente' : duel.isWO ? 'W.O.' : 'Concluído'}
        </span>
        {!isPending && (
          <span style={{ fontFamily: ACT.fM, fontWeight: 600, fontSize: 14, color: ACT.fg, fontFeatureSettings: '"tnum"', whiteSpace: 'nowrap' }}>
            {duel.votesA} × {duel.votesB}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[duel.entryA, duel.entryB].map((e, i) => {
          const winner = !isPending && duel.winner === (i === 0 ? 'A' : 'B');
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Avatar initials={e.initials} size={32} border={winner ? ACT.gold : ACT.border} borderWidth={winner ? 2 : 1} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: winner ? 700 : 500, color: ACT.fg, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                <div style={{ fontFamily: ACT.fS, fontStyle: 'italic', fontSize: 10, color: ACT.fg3, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.shop}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AoVivoTab({ event, currentDuel, roundDuels }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <AoVivoCurrentDuel duel={currentDuel} judgesCount={event.judgesCount} />

      <div>
        <h3 style={{ margin: '0 0 10px', fontFamily: ACT.fB, fontWeight: 600, fontSize: 13, color: ACT.fg2 }}>Duelos da rodada</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {roundDuels.map(d => <CompactDuelRow key={d.id} duel={d} />)}
        </div>
      </div>
    </div>
  );
}

// ───────── Chave tab: vertical column of round headers + DuelCards ─────────
function DuelMiniCard({ duel, active }) {
  return (
    <div style={{
      background: ACT.raised,
      border: active ? `1.5px solid ${ACT.brand}` : `1px solid ${ACT.border}`,
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-1)',
    }}>
      <div style={{ padding: '6px 12px', background: ACT.bg2, borderBottom: `1px solid ${ACT.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: ACT.fM, fontSize: 10, color: ACT.fg3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {active && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: ACT.live, marginRight: 6 }} />}
          Duelo {duel.position}
        </span>
        <Badge variant={duel.status === 'completed' ? 'success' : duel.status === 'walkover' ? 'warning' : 'default'}>
          {duel.status === 'completed' ? 'Concluído' : duel.status === 'in_progress' ? 'Em andamento' : duel.status === 'walkover' ? 'W.O.' : 'Pendente'}
        </Badge>
      </div>

      {[['A', duel.entryA, duel.votesA], ['B', duel.entryB, duel.votesB]].map(([side, e, v], i) => {
        const winner = duel.winner === side;
        const showVotes = duel.status === 'completed' || duel.status === 'in_progress';
        return (
          <React.Fragment key={side}>
            {i === 1 && (
              <div style={{ padding: '4px 12px', background: ACT.bg, textAlign: 'center', fontSize: 10, fontWeight: 600, color: ACT.fg3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>VS</div>
            )}
            <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, background: winner ? ACT.liveSoft : ACT.surface, borderLeft: winner ? `4px solid ${ACT.live}` : 'none' }}>
              {e ? (
                <>
                  <Avatar initials={e.initials} size={36} border={ACT.border} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: ACT.fB, fontWeight: 600, fontSize: 13, color: ACT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
                      {winner && <span style={{ color: ACT.live, fontSize: 12 }}>★</span>}
                    </div>
                    <div style={{ fontSize: 11, color: ACT.fg3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.shop}</div>
                  </div>
                  {showVotes && (
                    <div style={{
                      padding: '2px 10px', borderRadius: 'var(--radius-sm)',
                      background: winner ? ACT.live : ACT.bg2,
                      color: winner ? '#fff' : ACT.fg2,
                      fontFamily: ACT.fM, fontWeight: 600, fontSize: 13, fontFeatureSettings: '"tnum"',
                    }}>{v}</div>
                  )}
                </>
              ) : (
                <>
                  <Avatar initials="—" size={36} border={ACT.border} />
                  <span style={{ color: ACT.fg3, fontSize: 13 }}>A definir</span>
                </>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ChaveTab({ rounds, activeDuelId }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {rounds.map(round => (
        <div key={round.id}>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h3 style={{ margin: 0, fontFamily: ACT.fD, fontWeight: 700, fontSize: 16, color: ACT.fg }}>{round.label}</h3>
            <span style={{ fontSize: 12, color: ACT.fg3 }}>{round.duels.length} duelos</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {round.duels.map(d => <DuelMiniCard key={d.id} duel={d} active={d.id === activeDuelId} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────── Leaderboard tab ─────────
function LeaderboardTab({ leaderboard }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontFamily: ACT.fD, fontWeight: 700, fontSize: 18, color: ACT.fg }}>Classificação</h3>
        <Badge variant="warning">Final</Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {leaderboard.map((row, i) => {
          const isTop3 = row.position <= 3;
          const ringColor = row.position === 1 ? ACT.marigold : row.position === 2 ? 'var(--crema-300)' : row.position === 3 ? ACT.brand : ACT.border;
          return (
            <div key={row.id} style={{
              background: ACT.raised, border: `1px solid ${ACT.border}`,
              borderRadius: 'var(--radius-md)', padding: 12,
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: isTop3 ? 'var(--shadow-1)' : 'none',
            }}>
              <div style={{
                fontFamily: ACT.fM, fontWeight: 700, fontSize: 18, width: 28, textAlign: 'center',
                color: row.position === 1 ? ACT.brand : ACT.fg3, fontFeatureSettings: '"tnum"',
              }}>{row.position}</div>
              <Avatar initials={row.initials} size={40} border={ringColor} borderWidth={isTop3 ? 2 : 1} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: ACT.fB, fontWeight: 600, fontSize: 14, color: ACT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
                <div style={{ fontFamily: ACT.fS, fontStyle: 'italic', fontSize: 12, color: ACT.fg3 }}>{row.shop}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: ACT.fM, fontWeight: 600, fontSize: 14, color: ACT.fg }}>{row.wins} <span style={{ color: ACT.fg3, fontWeight: 400 }}>vit.</span></div>
                <div style={{ fontSize: 11, color: ACT.fg3 }}>{row.votes} votos</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Header, AoVivoTab, ChaveTab, LeaderboardTab, Badge, Avatar });
