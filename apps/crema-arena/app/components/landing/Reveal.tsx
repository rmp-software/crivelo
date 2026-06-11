"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

// Scroll-reveal wrapper shared by the landing sections (RMP-204).
//
// Hydration + reduced-motion contract:
// - Always renders a motion.div — never switches element type between server and
//   client, which would cause an SSR/hydration mismatch.
// - `useReducedMotion()` is null on the server but resolves on the client, so we do
//   NOT branch markup on it during the first render. We gate it behind a `mounted`
//   flag: server and first client paint render identically and, crucially, VISIBLE.
//   The `initial` hidden state (opacity:0) is armed ONLY after mount — before mount
//   `initial={false}` so the server HTML / first paint render at the element's resting
//   visible state with NO flash of invisible content (which would otherwise hit
//   reduced-motion users and any in-viewport content for a frame). After mount we arm
//   the reveal: reduced-motion drives straight to the visible `animate` target (no
//   motion), normal motion runs the whileInView reveal for off-screen elements.
export function Reveal({
  delay = 0,
  className,
  children,
  "aria-hidden": ariaHidden,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Reduced motion takes effect only after mount, so the first client render
  // matches the server (both use the whileInView reveal path).
  const reduced = mounted && reduce;

  return (
    <motion.div
      className={className}
      aria-hidden={ariaHidden}
      initial={mounted ? { opacity: 0, y: 24 } : false}
      {...(reduced
        ? { animate: { opacity: 1, y: 0 } }
        : {
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.2 },
          })}
      transition={{ duration: reduced ? 0 : 0.6, ease: "easeOut", delay: reduced ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
