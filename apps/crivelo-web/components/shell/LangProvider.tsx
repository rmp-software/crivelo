"use client";

/**
 * Language controller (RMP-190).
 *
 * For this sub-issue the EN/PT switcher is UI-only: it persists the choice to
 * localStorage ('coa-lang') and reflects the active state, but does NOT change
 * the page language yet. Real locale routing (next-intl, path-prefixed locales)
 * is RMP-193 — this provider gives that work a single seam to hook into.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "EN" | "PT";

const STORAGE_KEY = "coa-lang";

interface LangContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({
  initial = "EN",
  children,
}: {
  initial?: Lang;
  children: ReactNode;
}) {
  const [lang, setState] = useState<Lang>(initial);

  // Hydrate from storage after mount (keeps SSR deterministic).
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "EN" || v === "PT") setState(v);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used within <LangProvider>");
  }
  return ctx;
}
