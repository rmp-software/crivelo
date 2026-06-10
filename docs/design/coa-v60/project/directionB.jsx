/* Direction B — "Console". The calculator as a physical brewing device:
 * an espresso panel with a mono display, tactile stepped controls, and a
 * ticked pour timeline. Precise, instrument-like — the "code" side.
 * Teal reads as the device's active glow. */
function DirectionB() {
  const { dose, setDose, ratio, setRatio, acidity, setAcidity, strengthPours, setStrength, recipe } = useRecipe({});
  const C = window.Coa;
  const aIdx = Math.round((acidity + 1) * 2); // 0..4

  const grain = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";
  const cream = 'var(--crema-50)';
  const muted = 'rgba(245,236,216,0.55)';
  const line = 'rgba(245,236,216,0.12)';
  const wrap = { width: 390, background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--font-body)', padding: '0 18px 26px', boxSizing: 'border-box' };
  const cap = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600 };
  const monoF = { fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum","zero"' };

  const dchip = (active) => ({ width: 34, height: 34, borderRadius: 'var(--radius-sm)', border: '1px solid ' + line, background: 'rgba(255,255,255,0.05)', color: cream, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' });

  return (
    <div style={wrap}>
      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Monogram px={24} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>Coa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>
          <span style={{ color: 'var(--fg)' }}>EN</span><span>·</span><span>PT</span>
        </div>
      </header>

      <div style={{ ...cap, color: 'var(--fg-3)', marginBottom: 12 }}>4:6 brew console</div>

      {/* the device */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', background: 'var(--espresso-900)', boxShadow: 'var(--shadow-2), inset 0 1px 0 rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: grain, backgroundSize: '160px 160px', opacity: 0.05, pointerEvents: 'none' }} />

        {/* display */}
        <div style={{ position: 'relative', padding: '22px 22px 20px', borderBottom: '1px solid ' + line }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...cap, color: muted }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--coa-glow)', boxShadow: '0 0 8px var(--coa-glow)' }} />Ready
            </span>
            <Lockup size="sm" variant="light" mono={false} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ ...cap, color: muted, marginBottom: 4 }}>Total time</div>
              <div style={{ ...monoF, color: cream, fontSize: 52, fontWeight: 600, lineHeight: 0.9, letterSpacing: '-0.02em' }}>{recipe.totalTime}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...cap, color: muted, marginBottom: 4 }}>Water</div>
              <div style={{ ...monoF, color: 'var(--coa-glow)', fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{recipe.waterG}<span style={{ fontSize: 15, color: muted }}> g</span></div>
            </div>
          </div>
        </div>

        {/* controls */}
        <div style={{ position: 'relative', padding: '18px 22px 6px' }}>
          {/* dose + ratio */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 }}>
            <span style={{ ...cap, color: muted }}>Coffee</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={dchip()} onClick={() => setDose(C.clamp(dose - 1, 8, 60))}><Icon name="minus" size={15} color={cream} /></button>
              <span style={{ ...monoF, color: cream, fontWeight: 600, fontSize: 19, minWidth: 48, textAlign: 'center' }}>{dose} g</span>
              <button style={dchip()} onClick={() => setDose(C.clamp(dose + 1, 8, 60))}><Icon name="plus" size={15} color={cream} /></button>
            </div>
          </div>
          <div style={{ height: 1, background: line }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
            <span style={{ ...cap, color: muted }}>Ratio</span>
            <SegPills dark options={[14, 15, 16, 17].map((v) => ({ value: v, label: '1:' + v }))} value={ratio} onChange={setRatio} accent="var(--coa)" />
          </div>
          <div style={{ height: 1, background: line }} />

          {/* acidity stepped scale */}
          <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 11 }}>
              <span style={{ ...cap, color: muted }}>Flavor</span>
              <span style={{ ...monoF, color: 'var(--coa-glow)', fontSize: 13, fontWeight: 600 }}>{C.tasteLabel(acidity)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <React.Fragment key={i}>
                  <button onClick={() => setAcidity(i / 2 - 1)} style={{ width: 18, height: 18, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: i === aIdx ? 'var(--coa-glow)' : 'rgba(255,255,255,0.12)',
                    boxShadow: i === aIdx ? '0 0 10px var(--coa-glow)' : 'none' }} />
                  {i < 4 && <div style={{ flex: 1, height: 2, background: line }} />}
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, ...cap, color: muted, fontSize: 10.5 }}>
              <span>Sweet</span><span>Bright</span>
            </div>
          </div>
          <div style={{ height: 1, background: line }} />

          {/* strength pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
            <span style={{ ...cap, color: muted }}>Strength</span>
            <SegPills dark options={[1, 2, 3, 4].map((v) => ({ value: v, label: String(v) }))} value={strengthPours} onChange={setStrength} accent="var(--coa)" />
          </div>
        </div>

        {/* timeline */}
        <div style={{ position: 'relative', padding: '4px 22px 22px' }}>
          <div style={{ ...cap, color: muted, marginBottom: 14 }}>Pour timeline</div>
          {recipe.steps.map((s, i) => (
            <div key={s.index} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 34 }}>
              <span style={{ ...monoF, color: muted, fontSize: 13, width: 30, textAlign: 'right' }}>{s.time}</span>
              <div style={{ position: 'relative', width: 12, alignSelf: 'stretch', display: 'flex', justifyContent: 'center' }}>
                {i > 0 && <div style={{ position: 'absolute', top: 0, bottom: '50%', width: 2, background: line }} />}
                <div style={{ position: 'absolute', top: '50%', bottom: 0, width: 2, background: line }} />
                <span style={{ position: 'relative', alignSelf: 'center', width: 9, height: 9, borderRadius: 999, background: s.phase === 'flavor' ? 'var(--coa-glow)' : cream }} />
              </div>
              <span style={{ flex: 1, fontSize: 13.5, color: 'rgba(245,236,216,0.78)' }}>{s.label}</span>
              <span style={{ ...monoF, color: cream, fontSize: 16, fontWeight: 600 }}>{s.cumulativeG}<span style={{ fontSize: 11, color: muted }}> g</span></span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 30 }}>
            <span style={{ ...monoF, color: muted, fontSize: 13, width: 30, textAlign: 'right' }}>{recipe.removeTime}</span>
            <div style={{ width: 12, display: 'flex', justifyContent: 'center' }}><div style={{ width: 2, height: '50%', background: line, alignSelf: 'flex-start' }} /></div>
            <span style={{ flex: 1, fontSize: 13.5, color: muted }}>Remove dripper</span>
          </div>
        </div>
      </div>

      {/* start */}
      <button style={{ width: '100%', height: 56, marginTop: 16, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', background: 'var(--coa)', color: '#fff', fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: 'var(--shadow-1)' }}>
        <Icon name="play" size={18} color="#fff" /> Begin brew <span style={{ ...monoF, opacity: 0.85 }}>{recipe.totalTime}</span>
      </button>
    </div>
  );
}
window.DirectionB = DirectionB;
