"use client";

/**
 * useViewport (RMP-191) — breakpoint hook. Ported from
 * apps/crivelo-web/.design/project/coa-shared.jsx: mobile <700, tablet 700–1023,
 * desktop ≥1024. Starts at "mobile" on the server / first render to keep
 * hydration deterministic, then syncs to the real width on mount.
 */
import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

function read(): Breakpoint {
  if (typeof window === "undefined") return "mobile";
  if (window.innerWidth >= 1024) return "desktop";
  if (window.innerWidth >= 700) return "tablet";
  return "mobile";
}

export function useViewport(): Breakpoint {
  // Deterministic first render (matches SSR) → sync on mount to avoid a
  // hydration mismatch on wide screens.
  const [bp, setBp] = useState<Breakpoint>("mobile");
  useEffect(() => {
    const sync = () => setBp(read());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return bp;
}
