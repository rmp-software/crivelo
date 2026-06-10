/* Direction A — "Worktop". Tool-forward, calm and editorial-clean.
 * The calculator IS the page. Hairlines, cream space, sliders with
 * labelled ends. Teal only on active fills + the primary action. */
function DirectionA() {
  const { dose, setDose, ratio, setRatio, acidity, setAcidity, strengthPours, setStrength, recipe } = useRecipe({});
  const C = window.Coa;

  const wrap = { width: 390, background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--font-body)', padding: '0 20px 26px', boxSizing: 'border-box' };
  const card = { background: 'var(--surface-raised)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)' };
  const cap = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--fg-3)' };
  const mono = (s) => ({ fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum","zero"', ...s });

  return (
    <div style={wrap}>
      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Monogram px={24} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>Coa</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--fg-3)', fontSize: 16, marginLeft: 2, whiteSpace: 'nowrap' }}>café coado</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>
          <span style={{ color: 'var(--fg)' }}>EN</span><span>·</span><span>PT</span>
        </div>
      </header>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 0 22px' }} />

      {/* title */}
      <div style={{ marginBottom: 18 }}>
        <div style={cap}>The 4:6 method</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.025em', lineHeight: 1.05, marginTop: 7 }}>
          Pour-over,<br />dialed in.
        </h1>
      </div>

      {/* recipe card */}
      <div style={{ ...card, padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <Stat label="Water" value={recipe.waterG} unit="g" big accent />
          <Stat label="Coffee" value={dose} unit="g" />
          <Stat label="Ratio" value={'1:' + ratio} unit="" />
        </div>
        <Row label="Coffee dose">
          <Stepper value={dose} onChange={setDose} step={1} min={8} max={60} suffix=" g" />
        </Row>
        <div style={{ height: 1, background: 'var(--border)' }} />
        <Row label="Ratio">
          <Stepper value={ratio} onChange={setRatio} step={1} min={12} max={18} format={(v) => '1:' + v} />
        </Row>
      </div>

      {/* taste card */}
      <div style={{ ...card, padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Icon name="sliders" size={16} color="var(--fg-3)" />
          <span style={cap}>Taste &amp; strength</span>
        </div>

        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Flavor balance</span>
            <span style={{ ...mono({ fontSize: 13, fontWeight: 600, color: 'var(--coa-ink)', whiteSpace: 'nowrap' }) }}>{C.tasteLabel(acidity)}</span>
          </div>
          <Slider value={acidity} min={-1} max={1} onChange={setAcidity} leftLabel="Sweet" rightLabel="Bright" />
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Strength</span>
            <span style={{ ...mono({ fontSize: 13, fontWeight: 600, color: 'var(--coa-ink)', whiteSpace: 'nowrap' }) }}>{strengthPours} pours · {C.strengthLabel(strengthPours).split(' ')[0]}</span>
          </div>
          <Slider value={strengthPours} min={1} max={4} step={1} onChange={setStrength} leftLabel="Light" rightLabel="Strong" />
        </div>
      </div>

      {/* schedule */}
      <div style={{ ...card, padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={cap}>Pour schedule</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...mono({ fontSize: 13, fontWeight: 600 }) }}>
            <Icon name="clock" size={14} color="var(--fg-3)" /> {recipe.totalTime}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 26, top: 8, bottom: 26, width: 1.5, background: 'var(--border)' }} />
          {recipe.steps.map((s) => (
            <div key={s.index} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '7px 0' }}>
              <span style={{ ...mono({ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }), width: 30, textAlign: 'right' }}>{s.time}</span>
              <span style={{ width: 11, height: 11, borderRadius: 999, flexShrink: 0, zIndex: 1, background: s.phase === 'flavor' ? 'var(--coa)' : 'var(--surface-raised)', border: s.phase === 'flavor' ? 'none' : '1.5px solid var(--fg-3)' }} />
              <span style={{ flex: 1, fontSize: 14, color: 'var(--fg-2)' }}>{s.label}</span>
              <span style={{ ...mono({ fontSize: 17, fontWeight: 600 }) }}>{s.cumulativeG}<span style={{ fontSize: 12, color: 'var(--fg-3)' }}> g</span></span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 8 }}>
            <span style={{ ...mono({ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }), width: 30, textAlign: 'right' }}>{recipe.removeTime}</span>
            <span style={{ width: 11, display: 'flex', justifyContent: 'center', zIndex: 1 }}><Icon name="check" size={13} color="var(--fg-3)" /></span>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--fg-3)' }}>Remove dripper · drawdown</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button style={{ width: '100%', height: 52, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', background: 'var(--coa)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: 'var(--shadow-1)' }}>
        Start brew <Icon name="arrowR" size={18} color="#fff" />
      </button>
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <span style={{ fontSize: 14, color: 'var(--fg-2)', textDecoration: 'underline', textDecorationColor: 'var(--border-strong)', textUnderlineOffset: 3, cursor: 'pointer' }}>How the 4:6 method works</span>
      </div>
    </div>
  );

  function Stat({ label, value, unit, big, accent }) {
    return (
      <div>
        <div style={{ ...cap, marginBottom: 5 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum","zero"', fontWeight: 600, fontSize: big ? 32 : 22, lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap', color: accent ? 'var(--coa-ink)' : 'var(--fg)' }}>
          {value}<span style={{ fontSize: big ? 15 : 12, color: 'var(--fg-3)', fontWeight: 500 }}>{unit ? ' ' + unit : ''}</span>
        </div>
      </div>
    );
  }
  function Row({ label, children }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        {children}
      </div>
    );
  }
}
window.DirectionA = DirectionA;
