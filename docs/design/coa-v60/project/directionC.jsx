/* Direction C — "Sieve". Editorial and design-forward. The signature is a
 * 2D taste pad built on the dot-matrix screen: drag the puck across
 * sweet<->bright (x) and light<->strong (y); kept dots light up, sieved
 * dots stay faint. Warm, human, opinionated type. */
function DirectionC() {
  const { dose, setDose, ratio, setRatio, acidity, setAcidity, strengthPours, setStrength, recipe } = useRecipe({});
  const C = window.Coa;
  const monoF = { fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum","zero"' };
  const cap = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--fg-3)' };

  const wrap = { width: 390, background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--font-body)', padding: '0 20px 28px', boxSizing: 'border-box' };

  // puck position from state
  const px = (acidity + 1) / 2;
  const py = (4 - strengthPours) / 3;

  const padRef = React.useRef(null);
  const setFromXY = (clientX, clientY) => {
    const el = padRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    let fx = C.clamp((clientX - r.left) / r.width, 0, 1);
    let fy = C.clamp((clientY - r.top) / r.height, 0, 1);
    setAcidity(Math.round((fx * 2 - 1) * 100) / 100);
    setStrength(C.clamp(Math.round(4 - fy * 3), 1, 4));
  };
  const padDown = (e) => {
    e.preventDefault(); setFromXY(e.clientX, e.clientY);
    const mv = (ev) => setFromXY(ev.clientX, ev.clientY);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const padW = 350, padH = 280;

  return (
    <div style={wrap}>
      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Monogram px={24} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>Coa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>
          <span style={{ color: 'var(--fg)' }}>EN</span><span>·</span><span>PT</span>
        </div>
      </header>

      {/* editorial hero */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ ...cap, marginBottom: 10 }}>Café coado · the 4:6 method</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 38, lineHeight: 1.04, letterSpacing: '-0.01em', color: 'var(--fg)' }}>
          Brew the cup<br />you mean to.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
          Set your taste on the screen below. Coa works out the pours.
        </p>
      </div>

      {/* taste pad */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={cap}>Taste</span>
          <span style={{ ...monoF, fontSize: 13, fontWeight: 600, color: 'var(--coa-ink)' }}>{C.tasteLabel(acidity)} · {strengthPours} pours</span>
        </div>
        <div ref={padRef} onPointerDown={padDown} style={{ position: 'relative', width: padW, height: padH, margin: '0 auto', borderRadius: 'var(--radius-md)', background: 'var(--surface-raised)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)', cursor: 'crosshair', touchAction: 'none', overflow: 'hidden' }}>
          {/* dot screen */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SieveGrid cols={9} rows={7} gap={38} dot={5} pad={6} puck={{ x: px, y: py }} accent="var(--coa)" />
          </div>
          {/* axis labels */}
          <span style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', ...cap, fontSize: 10 }}>Stronger</span>
          <span style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', ...cap, fontSize: 10 }}>Lighter</span>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', ...cap, fontSize: 10 }}>Sweet</span>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', ...cap, fontSize: 10 }}>Bright</span>
          {/* puck */}
          <div style={{ position: 'absolute', left: (8 + px * (padW - 16)), top: (8 + py * (padH - 16)), transform: 'translate(-50%,-50%)', width: 30, height: 30, borderRadius: 999, background: 'var(--coa)', boxShadow: '0 0 0 6px var(--coa-halo), var(--shadow-1)', border: '2px solid var(--surface-raised)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* dose / ratio editorial row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <MiniStep label="Coffee" value={dose + ' g'} dec={() => setDose(C.clamp(dose - 1, 8, 60))} inc={() => setDose(C.clamp(dose + 1, 8, 60))} />
        <div style={{ width: 1, height: 34, background: 'var(--border)' }} />
        <MiniStep label="Ratio" value={'1:' + ratio} dec={() => setRatio(C.clamp(ratio - 1, 12, 18))} inc={() => setRatio(C.clamp(ratio + 1, 12, 18))} />
        <div style={{ width: 1, height: 34, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...cap, marginBottom: 5 }}>Water</div>
          <div style={{ ...monoF, fontSize: 19, fontWeight: 600, color: 'var(--coa-ink)' }}>{recipe.waterG} g</div>
        </div>
      </div>

      {/* schedule: segmented fill bar + list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={cap}>Pour schedule</span>
        <span style={{ ...monoF, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={14} color="var(--fg-3)" />{recipe.totalTime}</span>
      </div>
      <div style={{ display: 'flex', gap: 3, height: 16, marginBottom: 16 }}>
        {recipe.steps.map((s) => (
          <div key={s.index} title={s.label} style={{ flex: s.pour, borderRadius: 4,
            background: s.phase === 'flavor' ? (s.index === 0 ? 'var(--coa)' : 'var(--coa-soft-2)') : 'var(--espresso-700)',
            opacity: s.phase === 'strength' ? 0.35 + 0.2 * s.index : 1 }} />
        ))}
      </div>
      <div>
        {recipe.steps.map((s) => (
          <div key={s.index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ ...monoF, fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', width: 32 }}>{s.time}</span>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--fg-2)' }}>{s.label}</span>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', ...monoF }}>+{s.pourG}</span>
            <span style={{ ...monoF, fontSize: 16, fontWeight: 600, width: 46, textAlign: 'right' }}>{s.cumulativeG}<span style={{ fontSize: 11, color: 'var(--fg-3)' }}> g</span></span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0 0' }}>
          <span style={{ ...monoF, fontSize: 13, fontWeight: 600, color: 'var(--fg-3)', width: 32 }}>{recipe.removeTime}</span>
          <span style={{ flex: 1, fontSize: 14, color: 'var(--fg-3)' }}>Remove dripper</span>
        </div>
      </div>

      {/* CTA */}
      <button style={{ width: '100%', height: 52, marginTop: 22, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', background: 'var(--coa)', color: '#fff', fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: 'var(--shadow-1)' }}>
        Start brew <Icon name="arrowR" size={18} color="#fff" />
      </button>
    </div>
  );

  function MiniStep({ label, value, dec, inc }) {
    const b = { width: 26, height: 26, borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...cap, marginBottom: 6 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={b} onClick={dec}><Icon name="minus" size={13} /></button>
          <span style={{ ...monoF, fontSize: 17, fontWeight: 600, minWidth: 44 }}>{value}</span>
          <button style={b} onClick={inc}><Icon name="plus" size={13} /></button>
        </div>
      </div>
    );
  }
}
window.DirectionC = DirectionC;
