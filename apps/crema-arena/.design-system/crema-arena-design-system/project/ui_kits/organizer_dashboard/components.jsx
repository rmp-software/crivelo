// Organizer Dashboard — components.jsx
// Mirrors the production /dashboard/events/[id] running surface in
// app/components/{Sidebar, RunningTopBar, EventStatStrip, NowPouring,
// TapToTally, BracketView}.tsx. Atom-level styles intentionally restated as
// inline objects per component to stay readable without a stylesheet.

const DT = {
  fg: 'var(--fg)', fg2: 'var(--fg-2)', fg3: 'var(--fg-3)', fg4: 'var(--fg-4)',
  bg: 'var(--bg)', bg2: 'var(--bg-2)', bg3: 'var(--bg-3)',
  surface: 'var(--surface)', raised: 'var(--surface-raised)',
  border: 'var(--border)', borderStrong: 'var(--border-strong)',
  brand: 'var(--brand)', brandSoft: 'var(--brand-soft)',
  brandHover: 'var(--brand-hover)', brandPress: 'var(--brand-press)',
  espresso: 'var(--espresso-900)', espresso700: 'var(--espresso-700)',
  cremaLight: 'var(--crema-50)', cremaMid: 'var(--crema-100)', cremaDim: 'var(--crema-300)',
  gold: 'var(--gold)', goldSoft: 'var(--gold-soft)',
  marigold: 'var(--marigold-500)',
  live: 'var(--live)', liveSoft: 'var(--live-soft)', liveDeep: 'var(--mint-700)',
  danger: 'var(--danger)', dangerSoft: 'var(--danger-soft)',
  success: 'var(--success)', successSoft: 'var(--success-soft)',
  warning: 'var(--warning)', warningSoft: 'var(--warning-soft)',
  cinnamon600: 'var(--cinnamon-600)', cinnamon700: 'var(--cinnamon-700)',
  fD: 'var(--font-display)', fB: 'var(--font-body)',
  fM: 'var(--font-mono)', fS: 'var(--font-serif)',
};

function Icon({ name, size = 18, stroke = 1.75 }) {
  return <i data-lucide={name} style={{ width: size, height: size, strokeWidth: stroke }} />;
}
function useLucide(deps) {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, deps);
}

// ───────── Atom: Button (matches Button.tsx variants × sizes) ─────────
function Button({ variant = 'primary', size = 'md', children, onClick, disabled }) {
  const sizes = {
    sm: { fs: 14, pad: '6px 12px', radius: 'var(--radius-xs)', min: 36, gap: 6 },
    md: { fs: 16, pad: '8px 16px', radius: 'var(--radius-sm)', min: 44, gap: 8 },
    lg: { fs: 18, pad: '12px 24px', radius: 'var(--radius-md)', min: 52, gap: 10 },
  }[size];
  const v = {
    primary:   { bg: DT.brand, fg: '#fff', border: 'transparent' },
    secondary: { bg: DT.bg2, fg: DT.fg, border: DT.borderStrong },
    danger:    { bg: DT.danger, fg: '#fff', border: 'transparent' },
    ghost:     { bg: 'transparent', fg: DT.fg2, border: 'transparent' },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sizes.gap,
      padding: sizes.pad, minHeight: sizes.min, borderRadius: sizes.radius,
      background: v.bg, color: v.fg,
      border: `1px solid ${v.border}`,
      fontFamily: DT.fB, fontSize: sizes.fs, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      boxShadow: variant === 'primary' || variant === 'danger' ? '0 1px 2px rgba(31,20,16,.08)' : 'none',
      transition: 'background var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)',
    }}>{children}</button>
  );
}

function Badge({ variant = 'default', children }) {
  const v = {
    default: { bg: DT.bg3, fg: DT.fg2 },
    success: { bg: DT.successSoft, fg: DT.success },
    warning: { bg: DT.warningSoft, fg: DT.warning },
    danger:  { bg: DT.dangerSoft,  fg: DT.danger  },
  }[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 10px', borderRadius: 999,
      background: v.bg, color: v.fg,
      fontFamily: DT.fB, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Avatar({ initials, size = 40, border = DT.border, borderWidth = 2, light = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      background: light ? DT.espresso700 : DT.bg2,
      color: light ? DT.cremaMid : DT.fg3,
      border: `${borderWidth}px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: DT.fD, fontWeight: 700, fontSize: Math.round(size * 0.36),
    }}>{initials}</div>
  );
}

// ───────── Sidebar (espresso panel, cinnamon-700 active route) ─────────
function Sidebar({ active, onChange, user }) {
  const items = [
    { id: 'dashboard',  label: 'Dashboard',     icon: 'layout-dashboard' },
    { id: 'events',     label: 'Eventos',       icon: 'calendar' },
    { id: 'competitors',label: 'Competidores',  icon: 'users' },
    { id: 'organizers', label: 'Organizadores', icon: 'building-2' },
  ];
  return (
    <aside role="navigation" aria-label="Menu principal" style={{
      width: 256, background: DT.espresso, color: DT.cremaLight,
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
    }}>
      <div style={{ padding: 20, borderBottom: `1px solid ${DT.espresso700}` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <img src="../../assets/monogram.svg" alt="" width={32} height={32} />
          <span style={{ fontSize: 22, lineHeight: 1 }}>
            <span style={{ fontFamily: DT.fS, fontStyle: 'italic', color: DT.cremaLight }}>Crema</span>
            <span style={{ fontFamily: DT.fD, fontWeight: 800, color: DT.brand, marginLeft: 4 }}>Arena</span>
          </span>
        </div>
        <div style={{ marginTop: 10, fontFamily: DT.fM, fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: DT.cremaDim }}>
          Painel admin
        </div>
      </div>

      <nav style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(it => {
          const on = active === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', minHeight: 44,
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              background: on ? DT.cinnamon700 : 'transparent',
              color: on ? DT.cremaLight : DT.cremaMid,
              fontFamily: DT.fB, fontSize: 14, fontWeight: 500, textAlign: 'left',
              transition: 'background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard)',
            }}>
              <Icon name={it.icon} size={18} stroke={on ? 1.85 : 1.6} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 14, borderTop: `1px solid ${DT.espresso700}` }}>
        <div style={{ padding: '0 8px 12px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: DT.cremaLight }}>{user.name}</div>
          <div style={{ fontSize: 12, color: DT.cremaMid }}>{user.email}</div>
          <div style={{ fontSize: 11, color: DT.brand, marginTop: 4, textTransform: 'capitalize' }}>{user.role}</div>
        </div>
        <button style={{
          width: '100%', minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
          color: DT.cremaMid, fontSize: 14, fontWeight: 500, borderRadius: 'var(--radius-sm)',
        }}>
          <Icon name="log-out" size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}

// ───────── Running event top bar ─────────
function RunningTopBar({ event, primaryAction }) {
  return (
    <header style={{
      background: DT.raised, borderRadius: 'var(--radius-lg)',
      padding: 24, border: `1px solid ${DT.border}`, boxShadow: 'var(--shadow-1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: DT.liveSoft, color: DT.live, flexShrink: 0, whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: DT.live }} />
              <span style={{ fontFamily: DT.fM, fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>Ao vivo</span>
            </span>
            <span style={{ fontSize: 13, color: DT.fg3 }}>
              {event.roundLabel} · <span style={{ fontFamily: DT.fM, fontFeatureSettings: '"tnum"' }}>{event.completedInRound} de {event.totalInRound}</span> duelos concluídos
            </span>
          </div>
          <h1 style={{ margin: 0, fontFamily: DT.fD, fontWeight: 700, fontSize: 32, color: DT.fg, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{event.name}</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: DT.fg3, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={14} stroke={1.6} />{event.dateLabel}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={14} stroke={1.6} />{event.location}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="users" size={14} stroke={1.6} />{event.judgesCount} {event.judgesCount === 1 ? 'juiz' : 'juízes'}</span>
          </p>
        </div>
        {primaryAction}
      </div>
    </header>
  );
}

// ───────── EventStatStrip — 4-card grid ─────────
function StatCard({ label, value, valueSecondary, sub, accent }) {
  return (
    <div style={{
      background: DT.raised, borderRadius: 'var(--radius-md)',
      padding: 18, boxShadow: 'var(--shadow-1)',
    }}>
      <div style={{ fontFamily: DT.fM, fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: DT.fg3 }}>{label}</div>
      <div style={{ marginTop: 4, fontFamily: DT.fM, fontSize: 36, fontWeight: 600, color: DT.fg, lineHeight: 1, letterSpacing: '-0.01em', fontFeatureSettings: '"tnum"' }}>
        {value}{valueSecondary && <span style={{ color: DT.fg3, fontWeight: 500 }}> {valueSecondary}</span>}
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: accent || DT.fg3 }}>{sub}</div>
    </div>
  );
}

function EventStatStrip({ stats }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {stats.map((s, i) => <StatCard key={i} {...s} />)}
    </section>
  );
}

// ───────── NowPouring — espresso hero with rings motif ─────────
function NowPouring({ duel, judgesCount }) {
  const cast = duel.votesA + duel.votesB;
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      background: DT.espresso, color: DT.cremaLight,
    }}>
      <img src="../../assets/rings.svg" alt="" aria-hidden style={{
        position: 'absolute', right: -48, top: -48, width: 256, height: 256,
        opacity: 0.25, pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', padding: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, whiteSpace: 'nowrap' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: DT.live, flexShrink: 0 }} />
          <span style={{ fontFamily: DT.fM, fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mint-100)' }}>
            Duelo ao vivo · Bateria {duel.position}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'baseline' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: DT.fD, fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{duel.entryA.name}</div>
            <div style={{ marginTop: 6, fontFamily: DT.fS, fontStyle: 'italic', fontSize: 16, color: 'var(--crema-200)' }}>{duel.entryA.shop}</div>
          </div>
          <span style={{ fontFamily: DT.fS, fontStyle: 'italic', fontSize: 24, color: 'var(--marigold-300)' }}>vs</span>
          <div style={{ minWidth: 0, textAlign: 'right' }}>
            <div style={{ fontFamily: DT.fD, fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{duel.entryB.name}</div>
            <div style={{ marginTop: 6, fontFamily: DT.fS, fontStyle: 'italic', fontSize: 16, color: 'var(--crema-200)' }}>{duel.entryB.shop}</div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{
            fontFamily: DT.fM, fontSize: 48, fontWeight: 600,
            lineHeight: 1, color: DT.cremaLight, fontFeatureSettings: '"tnum"', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}>{duel.votesA} × {duel.votesB}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: judgesCount }).map((_, i) => (
              <span key={i} style={{
                width: 10, height: 10, borderRadius: 999,
                border: `2px solid ${i < cast ? DT.marigold : 'var(--espresso-500)'}`,
                background: i < cast ? DT.marigold : 'transparent',
              }} />
            ))}
            <span style={{ marginLeft: 8, fontFamily: DT.fM, fontSize: 11, color: DT.cremaDim, letterSpacing: '.1em', textTransform: 'uppercase' }}>
              {cast} / {judgesCount}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────── TapToTally — head-judge vote capture (one tap = one vote) ─────────
function VoteButton({ competitor, votes }) {
  return (
    <button style={{
      display: 'flex', alignItems: 'center', gap: 16,
      width: '100%', textAlign: 'left',
      background: DT.raised, border: `2px solid ${DT.borderStrong}`,
      borderRadius: 'var(--radius-lg)', padding: 18, cursor: 'pointer',
      transition: 'border-color var(--dur-base) var(--ease-standard), background var(--dur-base) var(--ease-standard)',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = DT.brand; e.currentTarget.style.background = DT.brandSoft; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = DT.borderStrong; e.currentTarget.style.background = DT.raised; }}>
      <Avatar initials={competitor.initials} size={80} border={DT.border} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DT.fD, fontWeight: 700, fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.01em', color: DT.fg }}>{competitor.name}</div>
        <div style={{ marginTop: 4, fontFamily: DT.fS, fontStyle: 'italic', fontSize: 14, color: DT.fg2 }}>{competitor.shop}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ display: 'block', fontFamily: DT.fM, fontSize: 44, fontWeight: 600, lineHeight: 1, color: DT.fg, fontFeatureSettings: '"tnum"', letterSpacing: '-0.02em' }}>{votes}</span>
        <span style={{ display: 'block', marginTop: 4, fontFamily: DT.fM, fontSize: 10, fontWeight: 500, color: DT.fg3, textTransform: 'uppercase', letterSpacing: '.1em' }}>{votes === 1 ? 'voto' : 'votos'}</span>
      </div>
    </button>
  );
}

function TapToTally({ duel, judgesCount }) {
  const cast = duel.votesA + duel.votesB;
  const ready = cast >= judgesCount;
  return (
    <div style={{
      background: DT.raised, border: `1px solid ${DT.border}`,
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-1)',
      padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div>
        <h3 style={{ margin: 0, fontFamily: DT.fD, fontWeight: 700, fontSize: 20, color: DT.fg, letterSpacing: '-0.01em' }}>
          Duelo {duel.position} · {duel.roundLabel}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: DT.fg3 }}>Toque no copo escolhido pelo jurado. Um toque = um voto.</p>
      </div>

      {/* pour photo placeholder */}
      <div style={{
        background: 'repeating-linear-gradient(135deg, var(--bg-2) 0 14px, var(--bg-3) 14px 28px)',
        borderRadius: 'var(--radius-md)', height: 140,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: DT.fg3, fontFamily: DT.fM, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase',
      }}>[foto dos copos servidos]</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[['A', duel.entryA, duel.votesA], ['B', duel.entryB, duel.votesB]].map(([side, e, v]) => (
          <div key={side} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <VoteButton competitor={e} votes={v} />
            <button style={{
              alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: v > 0 ? 'pointer' : 'not-allowed',
              fontFamily: DT.fM, fontSize: 11, fontWeight: 500,
              color: DT.fg3, textTransform: 'uppercase', letterSpacing: '.08em',
              padding: '6px 12px', opacity: v > 0 ? 1 : 0.4,
            }}>− Remover voto</button>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${DT.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!ready && (
          <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: DT.fg3 }}>
            Faltam {judgesCount - cast} {judgesCount - cast === 1 ? 'voto' : 'votos'}
          </p>
        )}
        <Button variant="primary" size="lg" disabled={!ready}>
          <Icon name="trophy" size={20} stroke={1.75} />
          Encerrar duelo
        </Button>
      </div>
    </div>
  );
}

// ───────── Bracket column — DuelCard ─────────
function DuelCard({ duel, active }) {
  const statusBadge = {
    completed:   <Badge variant="success">Concluído</Badge>,
    in_progress: <Badge variant="default">Em andamento</Badge>,
    walkover:    <Badge variant="warning">W.O.</Badge>,
    pending:     <Badge variant="default">Pendente</Badge>,
  }[duel.status];
  return (
    <div style={{
      background: DT.raised, borderRadius: 'var(--radius-md)', overflow: 'hidden',
      boxShadow: 'var(--shadow-1)',
      border: active ? `1.5px solid ${DT.brand}` : `1px solid ${DT.border}`,
    }}>
      <div style={{ padding: '8px 12px', background: DT.bg2, borderBottom: `1px solid ${DT.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: DT.fg3, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {active && <span style={{ width: 6, height: 6, borderRadius: 999, background: DT.live }} />}
          Duelo {duel.position}
        </span>
        {statusBadge}
      </div>

      {[['A', duel.entryA, duel.votesA], ['B', duel.entryB, duel.votesB]].map(([side, e, v], i) => {
        const winner = duel.winner === side;
        const showVotes = duel.status === 'completed' || duel.status === 'in_progress';
        return (
          <React.Fragment key={side}>
            {i === 1 && (
              <div style={{ padding: '4px 12px', background: DT.bg, textAlign: 'center', fontSize: 11, fontWeight: 600, color: DT.fg3, letterSpacing: '.08em', textTransform: 'uppercase' }}>VS</div>
            )}
            <div style={{
              padding: 12, display: 'flex', alignItems: 'center', gap: 12,
              background: winner ? DT.successSoft : DT.surface,
              borderLeft: winner ? `4px solid ${DT.success}` : 'none',
            }}>
              {e ? (
                <>
                  <Avatar initials={e.initials} size={40} border={DT.border} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: DT.fB, fontWeight: 600, fontSize: 14, color: DT.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
                      {winner && <Icon name="trophy" size={14} stroke={1.75} />}
                    </div>
                    <div style={{ fontSize: 12, color: DT.fg3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.shop}</div>
                  </div>
                  {showVotes && (
                    <div style={{
                      padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                      background: winner ? DT.success : DT.bg2,
                      color: winner ? '#fff' : DT.fg2,
                      fontFamily: DT.fM, fontWeight: 600, fontSize: 14, fontFeatureSettings: '"tnum"',
                    }}>{v}</div>
                  )}
                </>
              ) : (
                <>
                  <Avatar initials="—" size={40} border={DT.border} />
                  <span style={{ color: DT.fg3, fontSize: 14 }}>A definir</span>
                </>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function BracketColumn({ label, count, duels, activeDuelId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280, flex: 1 }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: 0, fontFamily: DT.fD, fontWeight: 600, fontSize: 15, color: DT.fg }}>{label}</h3>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: DT.fg3 }}>{count} {count === 1 ? 'duelo' : 'duelos'}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {duels.map(d => <DuelCard key={d.id} duel={d} active={d.id === activeDuelId} />)}
      </div>
    </div>
  );
}

Object.assign(window, {
  DT, Icon, useLucide, Button, Badge, Avatar,
  Sidebar, RunningTopBar, EventStatStrip, StatCard,
  NowPouring, TapToTally, BracketColumn, DuelCard,
});
