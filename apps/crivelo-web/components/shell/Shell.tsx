"use client";

/**
 * Shell (RMP-190) — the client wrapper that wires the Crivelo chrome around the
 * page. Mirrors how coa-home.jsx owned menu/theme/lang state: it provides the
 * theme + language controllers, owns the nav-sheet open state, and lays out
 * Header → NavSheet → children → Footer.
 *
 * Rendered inside the server layout's <body>; the theme controller applies the
 * resolved theme onto <html> (set before paint by the no-FOUC script in the
 * layout head), so the document chrome stays a Server Component.
 */
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@crivelo/ui/lib/utils";
import { ThemeProvider } from "./ThemeProvider";
import { Header } from "./Header";
import { NavSheet } from "./NavSheet";
import { Footer } from "./Footer";

export function Shell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  // Shell owns the hamburger ref purely so it can be threaded down to the sheet
  // for focus-return. The drawer MECHANISM (Escape-to-close, body-scroll-lock,
  // focus-trap, AND focus-return) is owned by Radix Dialog inside NavSheet — see
  // SheetContent's onCloseAutoFocus, which returns focus here AFTER the close
  // animation completes (RMP-206a2). No hand-rolled keydown/overflow/focus
  // effects live here anymore; they duplicated and raced Radix's behaviour.
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setMenu(false);

  return (
    <ThemeProvider>
      <div
        className={cn(
          "flex min-h-screen flex-col font-body",
          "bg-bg text-fg",
          "transition-[background] duration-stage ease-standard",
        )}
      >
        <Header ref={menuButtonRef} onMenu={() => setMenu(true)} />
        <NavSheet open={menu} onClose={closeMenu} returnFocusRef={menuButtonRef} />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
