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
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { LangProvider, type Lang } from "./LangProvider";
import { Header } from "./Header";
import { NavSheet } from "./NavSheet";
import { Footer } from "./Footer";

export function Shell({
  initialLang = "EN",
  children,
}: {
  initialLang?: Lang;
  children: ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  // Shell owns the hamburger ref so it can return focus there when the sheet
  // closes (FIX 3: focus return on close).
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setMenu(false);

  // Escape closes the sheet (FIX 3) — document-level listener, active only while
  // the menu is open; cleaned up on close/unmount.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  // Body scroll lock while the menu is open (FIX 4); restored on close/unmount.
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  // Return focus to the hamburger when the sheet finishes closing (FIX 3).
  // Skip the initial mount (menu starts false) so we don't steal focus on load.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (!menu) menuButtonRef.current?.focus();
  }, [menu]);

  return (
    <ThemeProvider>
      <LangProvider initial={initialLang}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg)",
            color: "var(--fg)",
            fontFamily: "var(--font-body)",
            transition: "background var(--dur-stage) var(--ease-standard)",
          }}
        >
          <Header ref={menuButtonRef} onMenu={() => setMenu(true)} />
          <NavSheet open={menu} onClose={closeMenu} />
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
        </div>
      </LangProvider>
    </ThemeProvider>
  );
}
