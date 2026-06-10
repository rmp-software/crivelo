"use client";

/**
 * Theme controller (RMP-190).
 *
 * Owns the Light / Dark / System preference for the whole site and applies the
 * resolved theme by setting `document.documentElement.dataset.theme` to
 * 'light' | 'dark' — the same attribute the crivelo-tokens.css dark block keys
 * off. Mirrors the prototype's ownership in coa-home.jsx (themePref + sysDark via
 * matchMedia, persisted to localStorage 'coa-theme').
 *
 * A no-FOUC inline script (see layout.tsx) sets data-theme before first paint;
 * this provider then takes over and keeps it in sync with the live OS listener.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "coa-theme";
const MEDIA = "(prefers-color-scheme: dark)";

interface ThemeContextValue {
  themePref: ThemePref;
  resolved: ResolvedTheme;
  setThemePref: (next: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage unavailable */
  }
  return "system";
}

function prefersDark(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia(MEDIA).matches
    );
  } catch {
    return false;
  }
}

function apply(resolved: ResolvedTheme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = resolved;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Server render must be deterministic: start from the static defaults, then
  // hydrate from localStorage/OS in the effect below (the inline no-FOUC script
  // already painted the correct theme, so there is no visible flash).
  const [themePref, setPref] = useState<ThemePref>("system");
  // Lazy initializer reads the OS preference synchronously on the first client
  // render, so a System-pref user on a dark OS resolves to 'dark' immediately —
  // no light→dark flash from an intermediate wrong apply(). On the server the
  // guard in prefersDark() returns false (deterministic SSR); the no-FOUC script
  // has already painted the correct theme before hydration.
  const [sysDark, setSysDark] = useState(prefersDark);

  // Hydrate the preference from storage after mount.
  useEffect(() => {
    setPref(readStored());
    setSysDark(prefersDark());
  }, []);

  // Live OS listener for System mode.
  useEffect(() => {
    let m: MediaQueryList;
    try {
      m = window.matchMedia(MEDIA);
    } catch {
      return;
    }
    const handler = (e: MediaQueryListEvent) => setSysDark(e.matches);
    if (m.addEventListener) m.addEventListener("change", handler);
    else m.addListener(handler);
    return () => {
      if (m.removeEventListener) m.removeEventListener("change", handler);
      else m.removeListener(handler);
    };
  }, []);

  const resolved: ResolvedTheme =
    themePref === "system" ? (sysDark ? "dark" : "light") : themePref;

  // Reflect the resolved theme onto <html> + persist the preference.
  useEffect(() => {
    apply(resolved);
  }, [resolved]);

  const setThemePref = useCallback((next: ThemePref) => {
    setPref(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ themePref, resolved, setThemePref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return ctx;
}

/**
 * The inline no-FOUC script body. Runs before first paint to set data-theme from
 * localStorage 'coa-theme' (default 'system' → resolved via the OS), avoiding a
 * flash of the wrong theme. Kept minimal and side-effect-safe.
 */
export const NO_FOUC_SCRIPT = `(function(){try{var p=localStorage.getItem('coa-theme')||'system';var d=p==='dark'||(p!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;
