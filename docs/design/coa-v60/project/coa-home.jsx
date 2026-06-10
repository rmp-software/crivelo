/* Coa — homepage. Crivelo shell (header + family nav + footer) wrapping the
 * 4:6 calculator (idle) and the brew timer (running). Responsive: single
 * column on mobile, two-column "set taste / your recipe" on tablet + desktop.
 * Editorial "Sieve" direction. Taste pad moves freely; strength rounds. */
function CoaHome() {
  const C = window.Coa;
  const bp = useViewport();
  const wide = bp !== 'mobile';
  const containerMax = bp === 'desktop' ? 1060 : bp === 'tablet' ? 680 : 390;

  // ---- theme (light / dark / system) / language / nav ----
  const [themePref, setThemePref] = React.useState(() => { try { return localStorage.getItem('coa-theme') || 'system'; } catch (e) { return 'system'; } });
  const [sysDark, setSysDark] = React.useState(() => { try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; } });
  const theme = themePref === 'system' ? (sysDark ? 'dark' : 'light') : themePref;
  const [lang, setLang] = React.useState(() => { try { return localStorage.getItem('coa-lang') || 'EN'; } catch (e) { return 'EN'; } });
  const [view, setView] = React.useState(() => { try { return localStorage.getItem('coa-view') || 'idle'; } catch (e) { return 'idle'; } });
  const [menu, setMenu] = React.useState(false);
  React.useEffect(() => { try { localStorage.setItem('coa-theme', themePref); } catch (e) {} }, [themePref]);
  React.useEffect(() => {
    try {
      const m = window.matchMedia('(prefers-color-scheme: dark)');
      const h = (e) => setSysDark(e.matches);
      m.addEventListener ? m.addEventListener('change', h) : m.addListener(h);
      return () => { m.removeEventListener ? m.removeEventListener('change', h) : m.removeListener(h); };
    } catch (e) {}
  }, []);
  React.useEffect(() => { try { localStorage.setItem('coa-lang', lang); } catch (e) {} }, [lang]);
  React.useEffect(() => { try { localStorage.setItem('coa-view', view); } catch (e) {} }, [view]);

  // ---- recipe ----
  const { dose, setDose, ratio, setRatio, acidity, setAcidity, strengthPours, setStrength, recipe } = useRecipe({});
  const monoF = { fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum","zero"' };
  const cap = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--fg-3)' };

  // ---- taste pad: free continuous position; strength rounds ----
  const padDims = bp === 'desktop' ? { w: 430, h: 350, gap: 48 } : bp === 'tablet' ? { w: 380, h: 300, gap: 41 } : { w: 350, h: 280, gap: 38 };
  const [pad, setPad] = React.useState(() => ({ x: (acidity + 1) / 2, y: (4 - strengthPours) / 3 }));
  const padRef = React.useRef(null);
  const setFromXY = (clientX, clientY) => {
    const el = padRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const fx = C.clamp((clientX - r.left) / r.width, 0, 1);
    const fy = C.clamp((clientY - r.top) / r.height, 0, 1);
    setPad({ x: fx, y: fy });
    setAcidity(Math.round((fx * 2 - 1) * 100) / 100);
    setStrength(C.clamp(Math.round(4 - fy * 3), 1, 4));
  };
  const padDown = (e) => {
    e.preventDefault(); setFromXY(e.clientX, e.clientY);
    const mv = (ev) => setFromXY(ev.clientX, ev.clientY);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const startBrew = () => { try { localStorage.removeItem('coa-brew'); } catch (e) {} setView('brew'); window.scrollTo(0, 0); };

  // ============ pieces ============
  const introEl = (
    <div style={{ marginBottom: wide ? 24 : 20 }}>
      <div style={{ ...cap, marginBottom: 8 }}>Café coado · the 4:6 method</div>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: bp === 'desktop' ? 30 : bp === 'tablet' ? 25 : 19, color: 'var(--fg-2)', margin: 0, lineHeight: 1.28, maxWidth: 17 + 'em' }}>
        Set your taste — Coa works out the pours.
      </p>
    </div>
  );

  const padEl = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={cap}>Taste</span>
        <span style={{ ...monoF, fontSize: 13, fontWeight: 600, color: 'var(--coa-ink)', whiteSpace: 'nowrap' }}>{C.tasteLabel(acidity)} · {strengthPours} pours</span>
      </div>
      <div ref={padRef} onPointerDown={padDown} style={{ position: 'relative', width: padDims.w, height: padDims.h, maxWidth: '100%', margin: wide ? 0 : '0 auto', borderRadius: 'var(--radius-md)', background: 'var(--surface-raised)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)', cursor: 'crosshair', touchAction: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SieveGrid cols={9} rows={7} gap={padDims.gap} dot={5} pad={6} puck={{ x: pad.x, y: pad.y }} accent="var(--coa-dot)" />
        </div>
        <span style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', ...cap, fontSize: 10 }}>Stronger</span>
        <span style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', ...cap, fontSize: 10 }}>Lighter</span>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', ...cap, fontSize: 10 }}>Sweet</span>
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', ...cap, fontSize: 10 }}>Bright</span>
        <div style={{ position: 'absolute', left: (8 + pad.x * (padDims.w - 16)), top: (8 + pad.y * (padDims.h - 16)), transform: 'translate(-50%,-50%)', width: 30, height: 30, borderRadius: 999, background: 'var(--coa)', boxShadow: '0 0 0 6px var(--coa-halo), var(--shadow-1)', border: '2px solid var(--surface-raised)', pointerEvents: 'none' }} />
      </div>
    </div>
  );

  const inputsEl = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: wide ? 'flex-start' : 'space-between', gap: wide ? 28 : 0, padding: '16px 4px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <MiniStep label="Coffee" value={dose + ' g'} dec={() => setDose(C.clamp(dose - 1, 8, 60))} inc={() => setDose(C.clamp(dose + 1, 8, 60))} />
      <div style={{ width: 1, height: 34, background: 'var(--border)' }} />
      <MiniStep label="Ratio" value={'1:' + ratio} dec={() => setRatio(C.clamp(ratio - 1, 12, 18))} inc={() => setRatio(C.clamp(ratio + 1, 12, 18))} />
      {!wide && <><div style={{ width: 1, height: 34, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...cap, marginBottom: 5 }}>Water</div>
          <div style={{ ...monoF, fontSize: 19, fontWeight: 600, color: 'var(--coa-ink)', whiteSpace: 'nowrap' }}>{recipe.waterG} g</div>
        </div></>}
    </div>
  );

  const panelHeaderEl = wide && (
    <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
      <div style={{ ...cap, marginBottom: 8 }}>Your recipe</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
        <span style={{ ...monoF, fontSize: 44, fontWeight: 600, lineHeight: 0.9, letterSpacing: '-0.02em', color: 'var(--coa-ink)', whiteSpace: 'nowrap' }}>{recipe.waterG}<span style={{ fontSize: 20, color: 'var(--fg-3)' }}> g</span></span>
        <span style={{ fontSize: 13.5, color: 'var(--fg-2)', paddingBottom: 4, lineHeight: 1.4 }}>{dose} g · 1:{ratio}<br />{C.tasteLabel(acidity)} · {strengthPours} pours</span>
      </div>
    </div>
  );

  const scheduleEl = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={cap}>Pour schedule</span>
        <span style={{ ...monoF, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={14} color="var(--fg-3)" />{recipe.totalTime}</span>
      </div>
      <div style={{ display: 'flex', gap: 3, height: 16, marginBottom: 16 }}>
        {recipe.steps.map((s) => (
          <div key={s.index} title={'Pour ' + (s.index + 1)} style={{ flex: s.pour, borderRadius: 4,
            background: s.phase === 'flavor' ? (s.index === 0 ? 'var(--coa)' : 'var(--coa-soft-2)') : 'rgba(var(--pour-strength-rgb), ' + (0.4 + 0.18 * s.index) + ')' }} />
        ))}
      </div>
      <div>
        {recipe.steps.map((s) => (
          <div key={s.index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ ...monoF, fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', width: 32 }}>{s.time}</span>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>Pour {s.index + 1}</span>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', ...monoF }}>+{s.pourG}</span>
            <span style={{ ...monoF, fontSize: 16, fontWeight: 600, width: 46, textAlign: 'right', whiteSpace: 'nowrap' }}>{s.cumulativeG}<span style={{ fontSize: 11, color: 'var(--fg-3)' }}> g</span></span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0 0' }}>
          <span style={{ ...monoF, fontSize: 13, fontWeight: 600, color: 'var(--fg-3)', width: 32 }}>{recipe.removeTime}</span>
          <span style={{ flex: 1, fontSize: 14, color: 'var(--fg-3)' }}>Remove dripper · drawdown</span>
        </div>
      </div>
    </>
  );

  const ctaEl = (
    <>
      <button onClick={startBrew} style={{ width: '100%', height: 56, marginTop: 24, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', background: 'var(--coa)', color: '#fff', fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: 'var(--shadow-1)' }}>
        <Icon name="play" size={18} color="#fff" /> Begin brew <span style={{ ...monoF, opacity: 0.85 }}>{recipe.totalTime}</span>
      </button>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <a href="https://crivelo.coffee/method/four-six" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: 'var(--fg-2)', textDecoration: 'none' }}>
          <Icon name="book" size={15} color="var(--fg-3)" />
          <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--border-strong)', textUnderlineOffset: 3 }}>How the 4:6 method works</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
        </a>
      </div>
    </>
  );

  const panelStyle = { background: 'var(--surface-raised)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)', padding: bp === 'desktop' ? 28 : 24 };

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--font-body)', transition: 'background var(--dur-stage) var(--ease-standard)' }}>
      <Header onMenu={() => setMenu(true)} max={containerMax} />
      <NavSheet open={menu} onClose={() => setMenu(false)} lang={lang} setLang={setLang} themePref={themePref} setThemePref={setThemePref} />

      {view === 'brew' ? (
        <BrewTimer recipe={recipe} onExit={() => setView('idle')} bp={bp} max={containerMax} />
      ) : (
        <>
          {wide ? (
            <main style={{ maxWidth: containerMax, margin: '0 auto', boxSizing: 'border-box', padding: bp === 'desktop' ? '40px 24px 8px' : '28px 24px 8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: bp === 'desktop' ? '1fr 1fr' : '1fr 1fr', gap: bp === 'desktop' ? 56 : 36, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {introEl}
                  {padEl}
                  {inputsEl}
                </div>
                <div style={{ ...panelStyle, position: bp === 'desktop' ? 'sticky' : 'static', top: 90 }}>
                  {panelHeaderEl}
                  {scheduleEl}
                  {ctaEl}
                </div>
              </div>
            </main>
          ) : (
            <main style={{ maxWidth: 390, margin: '0 auto', boxSizing: 'border-box', padding: '20px 20px 8px' }}>
              {introEl}
              <div style={{ marginBottom: 12 }}>{padEl}</div>
              <div style={{ marginBottom: 22 }}>{inputsEl}</div>
              {scheduleEl}
              {ctaEl}
            </main>
          )}

          <Footer lang={lang} setLang={setLang} max={containerMax} />
        </>
      )}
    </div>
  );

  function MiniStep({ label, value, dec, inc }) {
    const b = { width: 26, height: 26, borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...cap, marginBottom: 6 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={b} onClick={dec} aria-label={'decrease ' + label}><Icon name="minus" size={13} /></button>
          <span style={{ ...monoF, fontSize: 17, fontWeight: 600, minWidth: 44, whiteSpace: 'nowrap' }}>{value}</span>
          <button style={b} onClick={inc} aria-label={'increase ' + label}><Icon name="plus" size={13} /></button>
        </div>
      </div>
    );
  }
}
window.CoaHome = CoaHome;
