/* Coa — shared brand primitives used across the three directions.
 * Exports to window: Monogram, Lockup, SieveGrid, Icon, useRecipe, Slider,
 * Stepper, SegPills. Styled against Crivelo tokens + the Coa teal accent.
 */
const { useState, useRef, useEffect, useCallback } = React;

/* ---- Sieve monogram: 5x5 screen, kept dots form a C ---- */
function Monogram({ px = 26, color = 'var(--fg)' }) {
  const grid = [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
  ];
  const c = [8, 20, 32, 44, 56];
  return (
    <svg width={px} height={px} viewBox="0 0 64 64" style={{ display: 'block', flexShrink: 0 }} aria-hidden="true">
      {grid.flatMap((row, r) => row.map((on, k) =>
        <circle key={r + '-' + k} cx={c[k]} cy={c[r]} r={on ? 4 : 2} fill={color} opacity={on ? 1 : 0.16} />
      ))}
    </svg>
  );
}

/* ---- Coa's own mark: a V60 pour-over cone (ribs converging to the apex)
   with a drip. Carries Coa's teal accent — distinct from the house sieve. ---- */
function CoaMark({ px = 26, color = 'var(--coa)' }) {
  return (
    <svg width={px} height={px} viewBox="0 0 64 64" fill="none" style={{ display: 'block', flexShrink: 0 }} aria-hidden="true">
      <path d="M13 14.5 L51 14.5 L32 47 Z" stroke={color} strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 14.5 L32 47 M40 14.5 L32 47" stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity="0.42" />
      <path d="M32 50.5 C 28.6 54, 28.6 58.2, 32 58.2 C 35.4 58.2, 35.4 54, 32 50.5 Z" fill={color} />
    </svg>
  );
}

/* ---- Crivelo house lockup: the sieve monogram + the Crivelo wordmark.
   Used in shell chrome (nav, footer) where the HOUSE is the subject. ---- */
function CriveloLockup({ size = 'md', variant = 'dark' }) {
  const S = { sm: [20, 17], md: [26, 22], lg: [36, 29] }[size];
  const ink = variant === 'light' ? 'var(--crema-50)' : 'var(--fg)';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: ink }}>
      <Monogram px={S[0]} color={ink} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: S[1], letterSpacing: '-0.02em' }}>Crivelo</span>
    </div>
  );
}

/* ---- "Coa by Crivelo" endorsement lockup ---- */
function Lockup({ size = 'md', variant = 'dark', mono = true }) {
  const S = { sm: [20, 17, 10], md: [26, 22, 11], lg: [38, 32, 13] }[size];
  const ink = variant === 'light' ? 'var(--crema-50)' : 'var(--fg)';
  const muted = variant === 'light' ? 'var(--crema-300)' : 'var(--fg-3)';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: ink }}>
      {mono && <Monogram px={S[0]} color={ink} />}
      <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1, gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: S[1], letterSpacing: '-0.02em' }}>Coa</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: S[2], color: muted, letterSpacing: '0.01em' }}>
          by <span style={{ color: ink, fontWeight: 600 }}>Crivelo</span>
        </span>
      </span>
    </div>
  );
}

/* ---- Sieve grid: a screen of apertures. `fill` 0..1 lights kept dots
   row-major; `puck` {x,y} in 0..1 lights a neighborhood (taste-pad use). ---- */
function SieveGrid({ cols = 5, rows = 5, dot = 4, gap = 18, color = 'var(--fg)', accent = 'var(--coa)', fill = null, puck = null, pad = 10 }) {
  const w = pad * 2 + (cols - 1) * gap;
  const h = pad * 2 + (rows - 1) * gap;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const cx = pad + c * gap, cy = pad + r * gap;
    let on = false, near = 0;
    if (fill != null) { on = (r * cols + c) < Math.round(fill * cols * rows); }
    if (puck) {
      const dx = c / (cols - 1) - puck.x, dy = r / (rows - 1) - puck.y;
      near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2.4);
    }
    cells.push({ cx, cy, on, near });
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden="true">
      {cells.map((c, i) => puck
        ? <circle key={i} cx={c.cx} cy={c.cy} r={2 + c.near * (dot - 1.5)} fill={accent} opacity={0.14 + c.near * 0.86} />
        : <circle key={i} cx={c.cx} cy={c.cy} r={c.on ? dot : 2} fill={c.on ? accent : color} opacity={c.on ? 1 : 0.16} />)}
    </svg>
  );
}

/* ---- Minimal lucide-style icon set (outline, currentColor) ---- */
const PATHS = {
  scale: <><path d="M12 3v18M7 7h10" /><path d="M7 7l-3.2 6.5a3.3 3.3 0 006.4 0L7 7zM17 7l-3.2 6.5a3.3 3.3 0 006.4 0L17 7z" /><path d="M8 21h8" /></>,
  droplet: <path d="M12 3.2C9 7 5.5 10 5.5 14a6.5 6.5 0 0013 0c0-4-3.5-7-6.5-10.8z" />,
  ratio: <><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M8 16L16 8" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  thermo: <path d="M10 13.5V5a2 2 0 014 0v8.5a4 4 0 11-4 0z" />,
  play: <path d="M7 5l11 7-11 7V5z" />,
  chevR: <path d="M9 5l7 7-7 7" />,
  arrowR: <><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></>,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" /></>,
  sliders: <><path d="M5 7h10M19 7h0M5 12h2M11 12h8M5 17h8M17 17h2" /><circle cx="17" cy="7" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="15" cy="17" r="2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" /></>,
  check: <path d="M4 12.5l5 5 11-12" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12h2.5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" /></>,
  moon: <path d="M20 13.5A8 8 0 119.5 4a6.5 6.5 0 1010.5 9.5z" />,
  book: <><path d="M4 5.5A2 2 0 016 4h6v15H6a2 2 0 00-2 1.5V5.5z" /><path d="M20 5.5A2 2 0 0018 4h-6v15h6a2 2 0 012 1.5V5.5z" /></>,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M9 21h6M12 17v4" /></>,
};
function Icon({ name, size = 20, stroke = 1.6, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, ...style }} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/* ---- recipe state hook ---- */
function useRecipe(init) {
  const [dose, setDose] = useState(init?.dose ?? 20);
  const [ratio, setRatio] = useState(init?.ratio ?? 15);
  const [acidity, setAcidity] = useState(init?.acidity ?? 0);
  const [strengthPours, setStrength] = useState(init?.strengthPours ?? 3);
  const recipe = window.Coa.computeRecipe({ dose, ratio, acidity, strengthPours });
  return { dose, setDose, ratio, setRatio, acidity, setAcidity, strengthPours, setStrength, recipe };
}

/* ---- horizontal slider with labelled ends ---- */
function Slider({ value, min = -1, max = 1, step = 0.01, onChange, leftLabel, rightLabel, accent = 'var(--coa)' }) {
  const ref = useRef(null);
  const frac = (value - min) / (max - min);
  const set = useCallback((clientX) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    let f = (clientX - r.left) / r.width;
    f = Math.min(1, Math.max(0, f));
    let v = min + f * (max - min);
    v = Math.round(v / step) * step;
    onChange(v);
  }, [min, max, step, onChange]);
  const down = (e) => {
    e.preventDefault();
    set(e.clientX);
    const mv = (ev) => set(ev.clientX);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  return (
    <div>
      <div ref={ref} onPointerDown={down} style={{ position: 'relative', height: 40, cursor: 'pointer', touchAction: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 3, transform: 'translateY(-50%)', background: 'var(--border-strong)', borderRadius: 999 }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, width: (frac * 100) + '%', height: 3, transform: 'translateY(-50%)', background: accent, borderRadius: 999 }} />
        <div style={{ position: 'absolute', top: '50%', left: `calc(${frac * 100}% )`, transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: 999, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-1), 0 0 0 1.5px ' + accent }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-3)', fontWeight: 500 }}>
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}

/* ---- stepper (dose / ratio) ---- */
function Stepper({ value, onChange, step = 1, min = 1, max = 99, suffix = '', format }) {
  const btn = (dir) => () => onChange(window.Coa.clamp(value + dir * step, min, max));
  const bs = { width: 36, height: 36, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <button style={bs} onClick={btn(-1)} aria-label="decrease"><Icon name="minus" size={16} /></button>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 19, minWidth: 56, textAlign: 'center', fontFeatureSettings: '"tnum"' }}>
        {format ? format(value) : value}{suffix}
      </span>
      <button style={bs} onClick={btn(1)} aria-label="increase"><Icon name="plus" size={16} /></button>
    </div>
  );
}

/* ---- segmented pills ---- */
function SegPills({ options, value, onChange, accent = 'var(--coa)', dark = false }) {
  return (
    <div style={{ display: 'inline-flex', padding: 3, gap: 2, borderRadius: 'var(--radius-full)', background: dark ? 'rgba(255,255,255,0.08)' : 'var(--bg-2)', border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid var(--border)' }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={String(o.value)} onClick={() => onChange(o.value)} style={{
            border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-full)', padding: '7px 14px', minWidth: 40,
            fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, letterSpacing: '0.01em',
            background: on ? accent : 'transparent',
            color: on ? '#fff' : (dark ? 'var(--crema-300)' : 'var(--fg-2)'),
            transition: 'all var(--dur-base) var(--ease-standard)',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

/* ---- breakpoint hook: mobile <700, tablet 700–1023, desktop >=1024 ---- */
function useViewport() {
  const get = () => (typeof window === 'undefined' ? 'mobile' : window.innerWidth >= 1024 ? 'desktop' : window.innerWidth >= 700 ? 'tablet' : 'mobile');
  const [bp, setBp] = useState(get);
  useEffect(() => {
    const h = () => setBp(get());
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return bp;
}

Object.assign(window, { Monogram, CoaMark, CriveloLockup, Lockup, SieveGrid, Icon, useRecipe, useViewport, Slider, Stepper, SegPills });
