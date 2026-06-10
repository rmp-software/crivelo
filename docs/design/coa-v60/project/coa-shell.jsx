/* Coa — the Crivelo shell: sticky header, family nav sheet, footer.
 * House stays neutral; Coa's teal only marks the current tool + actions. */

const NAV_ITEMS = [
  { name: 'Coa', tag: 'the 4:6 calculator', href: '#', current: true, dot: 'var(--coa)' },
  { name: 'Crema Arena', tag: 'open in new tab', href: 'https://crema-arena.crivelo.coffee', external: true, dot: '#C0763C' },
  { name: 'Léxico', tag: 'soon', soon: true },
  { name: 'Diário', tag: 'soon', soon: true },
];

function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button onClick={onToggle} aria-label="Toggle light or dark" title="Toggle light / dark"
      style={{ width: 38, height: 38, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
    </button>
  );
}

function LangToggle({ lang, setLang, size = 'sm' }) {
  const big = size === 'lg';
  const item = (code) => ({
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: big ? 14 : 12.5, cursor: 'pointer',
    padding: big ? '6px 12px' : '0', borderRadius: 999,
    color: lang === code ? (big ? '#fff' : 'var(--fg)') : 'var(--fg-3)',
    background: big && lang === code ? 'var(--coa)' : 'transparent',
    border: 'none',
  });
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: big ? 4 : 6, padding: big ? 3 : 0, borderRadius: 999, background: big ? 'var(--bg-2)' : 'transparent', border: big ? '1px solid var(--border)' : 'none' }}>
      <button style={item('EN')} onClick={() => setLang('EN')}>EN</button>
      {!big && <span style={{ color: 'var(--fg-4)', fontSize: 12 }}>·</span>}
      <button style={item('PT')} onClick={() => setLang('PT')}>PT</button>
    </div>
  );
}

function Header({ onMenu, max = 390 }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: max, margin: '0 auto', boxSizing: 'border-box', padding: '0 16px', height: max > 700 ? 66 : 58, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onMenu} aria-label="Open menu" style={{ width: 40, height: 40, marginLeft: -4, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'var(--fg)' }}>
          <CoaMark px={25} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>Coa</span>
          <span style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 3 }}>by Crivelo</span>
        </a>
      </div>
    </header>
  );
}

function NavSheet({ open, onClose, lang, setLang, themePref, setThemePref }) {
  return (
    <div aria-hidden={!open} style={{ position: 'fixed', inset: 0, zIndex: 60, pointerEvents: open ? 'auto' : 'none' }}>
      {/* scrim */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(31,20,16,0.55)', opacity: open ? 1 : 0, transition: 'opacity var(--dur-stage) var(--ease-standard)' }} />
      {/* panel */}
      <aside style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '84%', maxWidth: 340, background: 'var(--bg)', boxShadow: 'var(--shadow-2)', transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform var(--dur-stage) var(--ease-standard)', display: 'flex', flexDirection: 'column', padding: '22px 22px 26px', boxSizing: 'border-box', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <CriveloLockup size="md" />
          <button onClick={onClose} aria-label="Close menu" style={{ width: 36, height: 36, marginTop: -4, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--fg-2)', margin: '0 0 20px', lineHeight: 1.35 }}>
          Tools for people who live coffee.
        </p>

        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--fg-3)', marginBottom: 8 }}>The house</div>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_ITEMS.map((it) => {
            const base = { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: it.soon ? 'var(--fg-4)' : 'var(--fg)', cursor: it.soon ? 'default' : 'pointer' };
            const inner = (
              <>
                <span style={{ width: 9, height: 9, borderRadius: 999, flexShrink: 0, background: it.dot || 'var(--fg-4)', opacity: it.soon ? 0.5 : 1 }} />
                <span style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>{it.name}</span>
                  {it.current && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: 'var(--coa-ink)' }}>· you are here</span>}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {it.tag}
                  {it.external && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>}
                </span>
              </>
            );
            return it.soon
              ? <div key={it.name} style={base}>{inner}</div>
              : <a key={it.name} href={it.href} onClick={it.current ? onClose : undefined} target={it.external ? '_blank' : undefined} rel={it.external ? 'noopener' : undefined} style={base}>{inner}</a>;
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--fg-3)', marginBottom: 10 }}>Language</div>
            <LangToggle lang={lang} setLang={setLang} size="lg" />
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--fg-3)', marginBottom: 10 }}>Appearance</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 3, borderRadius: 999, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              {[['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'System', 'monitor']].map(([k, label, icon]) => {
                const on = themePref === k;
                return (
                  <button key={k} onClick={() => setThemePref(k)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', borderRadius: 999, padding: '7px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, background: on ? 'var(--coa)' : 'transparent', color: on ? '#fff' : 'var(--fg-3)' }}>
                    <Icon name={icon} size={15} color={on ? '#fff' : 'var(--fg-3)'} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Footer({ lang, setLang, max = 390 }) {
  const cap = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--fg-3)' };
  const wide = max > 700;
  return (
    <footer style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)', marginTop: 40 }}>
      <div style={{ maxWidth: max, margin: '0 auto', boxSizing: 'border-box', padding: wide ? '40px 24px 32px' : '32px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: wide ? 'flex-end' : 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <CriveloLockup size={wide ? 'lg' : 'md'} />
            {wide && <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--fg-2)' }}>Tools for people who live coffee.</span>}
          </div>
          <SieveGrid cols={5} rows={5} gap={wide ? 12 : 9} dot={wide ? 3.4 : 2.6} pad={2} fill={0.36} color="var(--fg)" accent="var(--fg-3)" />
        </div>

        <div style={{ ...cap, marginBottom: 10 }}>The family</div>
        <div style={{ display: 'flex', flexDirection: wide ? 'row' : 'column', flexWrap: 'wrap', gap: wide ? 28 : 2, marginBottom: 24 }}>
          {NAV_ITEMS.map((it) => {
            const row = (
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: it.dot || 'var(--fg-4)', opacity: it.soon ? 0.5 : 1, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 14.5, color: it.soon ? 'var(--fg-4)' : 'var(--fg)' }}>{it.name}</span>
                {it.soon && <span style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>soon</span>}
                {it.external && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>}
              </span>
            );
            return it.soon
              ? <div key={it.name} style={{ padding: '5px 0' }}>{row}</div>
              : <a key={it.name} href={it.href} target={it.external ? '_blank' : undefined} rel={it.external ? 'noopener' : undefined} style={{ padding: '5px 0', textDecoration: 'none' }}>{row}</a>;
          })}
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 18 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>© 2026 Crivelo · Para quem vive café.</span>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { NAV_ITEMS, ThemeToggle, LangToggle, Header, NavSheet, Footer });
