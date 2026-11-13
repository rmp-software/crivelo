"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@crivelo/ui/lib/utils";
import { Icon } from "./icons";
import { TABS, isRootTabPath } from "./tabs";

/**
 * The navigation frame every screen renders inside.
 *
 * **One column, two bars.** The handoff's layout rule is a 440 px column with a
 * fixed 56 px top bar and a 64 px tab bar; desktop is the same column, centred.
 * So there is no separate desktop layout here — one `max-w-content` column, and
 * the wide viewport only reveals the page behind it (`bg-bg-3`, the shade the
 * handoff's UI kit puts behind the phone).
 *
 * **The body scrolls, not the document.** The shell is `h-dvh` and the content
 * sits in an `overflow-y-auto` region between the two bars, so the bars need no
 * `position: fixed` and the content needs no padding to compensate for them.
 * That also keeps `dvh` stable on mobile Safari — the window never scrolls, so
 * the toolbar never collapses mid-gesture — and it is what makes each screen's
 * `sticky` top bar (see `TopBar`) stick to the scroll region rather than the
 * document.
 *
 * **Navigation side effects live here, once.** Resetting the scroll offset and
 * moving focus to the new screen's heading are shell concerns: the scroll
 * container and the route are both only visible at this level, so fixing them
 * here fixes them for all nine screens instead of nine times.
 *
 * **The tab bar is derived, never passed.** `isRootTabPath` reads the path, so a
 * pushed screen hides the bar by virtue of its route and no screen has to
 * declare anything. The shell is the only client component in the frame; the
 * screens stay Server Components.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const navigated = useRef(false);

  /**
   * Move focus to the new screen's `<h1>` on every client navigation (TopBar
   * gives both of its headings `tabIndex={-1}` for exactly this).
   *
   * Without it the navigation is silent to a screen reader: `activeElement`
   * stays on `<body>`, nothing is announced, and the next Tab restarts from the
   * top of the document. The first render is deliberately skipped — on a cold
   * load the browser owns initial focus (and may be restoring a deep-link
   * fragment), and stealing it there fights the platform rather than helping.
   */
  useEffect(() => {
    if (!navigated.current) {
      navigated.current = true;
      return;
    }
    mainRef.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [pathname]);

  return (
    <div className="h-dvh bg-bg-3">
      <div className="mx-auto flex h-full max-w-content flex-col bg-bg">
        {/*
         * key={pathname} is what resets the scroll position. The scroll
         * container is rendered once by the root layout, so across a client
         * navigation only `children` changes — the element, and its
         * `scrollTop`, survive, and a brand-new screen opens scrolled
         * mid-page. Keying it per route remounts it, so the new screen starts
         * at the top of a fresh node; an effect setting `scrollTop = 0` would
         * also work but can paint the old offset for a frame first.
         *
         * DELIBERATE SCOPE: reset-to-top on EVERY pathname change, back
         * navigation included. Restoring the previous offset on back is a real
         * nicety, but it needs an offset saved per history entry and replayed
         * on pop. v1's lists are short — five recipes, six concentrates — so
         * what is lost is a few hundred pixels of re-scroll. Revisit when a
         * screen is long enough to miss it; this is a decision, not an
         * oversight.
         *
         * WIDER CONSEQUENCE: the key sits above ALL of `children`, so it also
         * remounts any nested `layout.tsx` added under this subtree later —
         * Next's layout persistence does not survive it. A multi-step flow
         * that needs state to live across steps (S6's builder, S0's three
         * swipes) must lift that state ABOVE AppShell, e.g. a provider in the
         * root layout, rather than leaning on a shared nested layout here.
         */}
        <main
          key={pathname}
          ref={mainRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </main>
        {isRootTabPath(pathname) && <TabBar pathname={pathname} />}
      </div>
    </div>
  );
}

/**
 * The root-tab bar: icon over label, the active tab in brand teal with a short
 * rule above it and a heavier icon stroke.
 *
 * Each tab is a `Link`, not a button — the tabs are routes, so they must be
 * openable, shareable and reachable with the keyboard. The 64 px bar makes every
 * tap target comfortably past the 44 px floor this app needs (wet hands).
 */
function TabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="flex h-tabbar shrink-0 border-t border-border bg-surface pb-1"
    >
      {TABS.map((tab) => {
        const active = tab.href === pathname;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              // gap-[3px]: the handoff's icon-to-label gap, off the 4 px scale.
              "relative flex flex-1 flex-col items-center justify-center gap-[3px] no-underline",
              active ? "text-brand" : "text-fg-3",
            )}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute -top-px h-0.5 w-6 rounded-full bg-brand"
              />
            )}
            <Icon name={tab.icon} stroke={active ? 2 : 1.75} />
            {/* 11px/14px: the handoff's tab label size, off the named scale. */}
            <span
              className={cn(
                "text-[11px]/[14px] tracking-[0.01em]",
                active ? "font-semibold" : "font-medium",
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
