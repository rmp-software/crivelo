/* Coa — running brew timer. A live dial that guides each pour of the 4:6
 * schedule. Counts real time (resumes across refresh — phone propped on the
 * counter), with pour ticks around the ring. Both themes. */
function BrewTimer({ recipe, onExit, bp = 'mobile', max = 390 }) {
  const wide = bp !== 'mobile';
  const C = window.Coa;
  const KEY = 'coa-brew';
  const monoF = { fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum","zero"' };
  const cap = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--fg-3)' };

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const [sess, setSess] = React.useState(() => load() || { base: 0, startTs: Date.now(), status: 'running' });
  const [, force] = React.useState(0);

  React.useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(sess)); } catch (e) {} }, [sess]);
  React.useEffect(() => { const id = setInterval(() => force((x) => x + 1), 200); return () => clearInterval(id); }, []);

  const liveElapsed = () => (sess.status === 'running' && sess.startTs != null) ? sess.base + (Date.now() - sess.startTs) / 1000 : sess.base;
  let elapsed = liveElapsed();
  const finished = elapsed >= recipe.removeAt;
  if (finished) elapsed = recipe.removeAt;

  React.useEffect(() => {
    if (sess.status === 'running' && liveElapsed() >= recipe.removeAt) {
      setSess({ base: recipe.removeAt, startTs: null, status: 'done' });
    }
  });

  // current pour
  const steps = recipe.steps;
  let curIdx = 0;
  for (let i = 0; i < steps.length; i++) if (elapsed >= steps[i].t) curIdx = i;
  const cur = steps[curIdx];
  const isLastPour = curIdx === steps.length - 1;
  const nextT = isLastPour ? recipe.removeAt : steps[curIdx + 1].t;
  const toNext = Math.max(0, Math.ceil(nextT - elapsed));
  const sinceStart = elapsed - cur.t;
  const pouring = sinceStart < 12 && !finished;
  const progress = C.clamp(elapsed / recipe.removeAt, 0, 1);

  // ring geometry
  const SZ = 248, R = 110, CX = SZ / 2, CIRC = 2 * Math.PI * R;
  const ticks = steps.map((s) => s.t / recipe.removeAt).concat([1]);

  const done = sess.status === 'done' || finished;
  const paused = sess.status === 'paused';

  const pause = () => setSess({ base: liveElapsed(), startTs: null, status: 'paused' });
  const resume = () => setSess((s) => ({ ...s, startTs: Date.now(), status: 'running' }));
  const restart = () => setSess({ base: 0, startTs: Date.now(), status: 'running' });
  const exit = () => { try { localStorage.removeItem(KEY); } catch (e) {} onExit(); };

  const centerStatus = done ? 'Brew complete' : (paused ? 'Paused' : 'Pour ' + (curIdx + 1) + ' of ' + steps.length);
  const ringColor = done ? 'var(--success)' : 'var(--coa)';

  return (
    <div style={{ maxWidth: wide ? (bp === 'desktop' ? 940 : 680) : 390, margin: '0 auto', boxSizing: 'border-box', padding: wide ? '18px 24px 44px' : '14px 20px 36px' }}>
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={exit} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: '6px 4px', marginLeft: -4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          Recipe
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...cap, color: done ? 'var(--success)' : 'var(--fg-2)' }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: done ? 'var(--success)' : (paused ? 'var(--fg-4)' : 'var(--coa)'), animation: (!paused && !done) ? 'coaPulse 1.6s var(--ease-standard) infinite' : 'none' }} />
          {done ? 'Done' : (paused ? 'Paused' : 'Brewing')}
        </span>
      </div>

      <div style={{ display: wide ? 'grid' : 'block', gridTemplateColumns: wide ? '300px 1fr' : undefined, gap: wide ? 44 : 0, alignItems: 'center', marginTop: wide ? 10 : 0 }}>
      <div>
      {/* dial */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 6px' }}>
        <div style={{ position: 'relative', width: SZ, height: SZ }}>
          <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={CX} cy={CX} r={R} fill="none" stroke="var(--border-strong)" strokeWidth="6" />
            <circle cx={CX} cy={CX} r={R} fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - progress)} style={{ transition: 'stroke-dashoffset 0.2s linear' }} />
            {ticks.map((t, i) => {
              const a = t * 2 * Math.PI, ix = CX + Math.cos(a) * (R + 13), iy = CX + Math.sin(a) * (R + 13);
              const ox = CX + Math.cos(a) * (R + 19), oy = CX + Math.sin(a) * (R + 19);
              const passed = progress >= t - 0.001;
              return <line key={i} x1={ix} y1={iy} x2={ox} y2={oy} stroke={passed ? ringColor : 'var(--border-strong)'} strokeWidth="2" strokeLinecap="round" />;
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span style={{ ...cap, color: done ? 'var(--success)' : 'var(--fg-3)', marginBottom: 6 }}>{centerStatus}</span>
            {done ? (
              <>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1.05 }}>Remove<br />the dripper</span>
              </>
            ) : (
              <>
                <span style={{ ...monoF, fontSize: 58, fontWeight: 600, lineHeight: 0.92, letterSpacing: '-0.02em', color: 'var(--fg)', whiteSpace: 'nowrap' }}>
                  {cur.cumulativeG}<span style={{ fontSize: 22, color: 'var(--fg-3)' }}> g</span>
                </span>
                <span style={{ ...monoF, fontSize: 15, fontWeight: 600, color: 'var(--coa-ink)', marginTop: 6, whiteSpace: 'nowrap' }}>+{cur.pourG} g this pour</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* action + countdown */}
      <div style={{ textAlign: 'center', minHeight: 58, marginBottom: 14 }}>
        {done ? (
          <div style={{ ...monoF, fontSize: 15, color: 'var(--fg-2)', fontWeight: 600 }}>Total time {recipe.totalTime}</div>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21, letterSpacing: '-0.01em', color: pouring ? 'var(--coa-ink)' : 'var(--fg-2)' }}>
              {pouring ? 'Pour now → ' + cur.cumulativeG + ' g' : 'Let it draw down'}
            </div>
            <div style={{ ...monoF, fontSize: 14, color: 'var(--fg-3)', marginTop: 4, fontWeight: 600 }}>
              {isLastPour ? 'Remove in ' : 'Next pour in '}<span style={{ color: 'var(--fg)' }}>{C.fmtTime(toNext)}</span>
              <span style={{ color: 'var(--fg-4)' }}>  ·  {C.fmtTime(Math.floor(elapsed))} / {recipe.totalTime}</span>
            </div>
          </>
        )}
      </div>
      </div>

      <div>
      {/* schedule list */}
      <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)', padding: '6px 16px', marginBottom: 18 }}>
        {steps.map((s, i) => {
          const stDone = i < curIdx || (finished);
          const active = i === curIdx && !finished;
          return (
            <div key={s.index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none', opacity: (!active && !stDone) ? 0.55 : 1 }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'var(--coa)' : (stDone ? 'transparent' : 'transparent'), border: active ? 'none' : '1.5px solid ' + (stDone ? 'var(--success)' : 'var(--border-strong)') }}>
                {stDone && <Icon name="check" size={11} color="var(--success)" stroke={2.4} />}
                {active && <span style={{ width: 6, height: 6, borderRadius: 999, background: '#fff' }} />}
              </span>
              <span style={{ ...monoF, fontSize: 13, fontWeight: 600, color: active ? 'var(--fg)' : 'var(--fg-3)', width: 34 }}>{s.time}</span>
              <span style={{ flex: 1, fontSize: 14, color: active ? 'var(--fg)' : 'var(--fg-2)', fontWeight: active ? 600 : 400 }}>Pour {i + 1}</span>
              <span style={{ ...monoF, fontSize: 15, fontWeight: 600, color: active ? 'var(--coa-ink)' : 'var(--fg-2)', whiteSpace: 'nowrap' }}>{s.cumulativeG} g</span>
            </div>
          );
        })}
      </div>

      {/* controls */}
      {done ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={restart} style={ctaStyle('var(--coa)')}>Brew again</button>
          <button onClick={exit} style={ctaStyle('transparent', true)}>Back to recipe</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={paused ? resume : pause} style={{ ...ctaStyle(paused ? 'var(--coa)' : 'transparent', !paused), flex: 1 }}>
            {paused ? <><Icon name="play" size={17} color="#fff" /> Resume</> : 'Pause'}
          </button>
          <button onClick={restart} aria-label="Restart brew" style={{ width: 56, height: 54, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.7L3 8" /><path d="M3 4v4h4" /></svg>
          </button>
        </div>
      )}
      </div>
      </div>
    </div>
  );

  function ctaStyle(bg, outline) {
    return { height: 54, borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%',
      background: bg, color: outline ? 'var(--fg)' : '#fff', border: outline ? '1px solid var(--border-strong)' : 'none', boxShadow: outline ? 'none' : 'var(--shadow-1)' };
  }
}
window.BrewTimer = BrewTimer;
