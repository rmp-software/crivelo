"use client";

/**
 * LangToggle (RMP-190) — EN / PT switcher. Two sizes (ported from coa-shell.jsx):
 *  - `sm` : inline "EN · PT" text toggle (footer).
 *  - `lg` : pill segmented control with the active code on the teal accent (nav).
 *
 * Reads/writes the shared language state (LangProvider). Locale routing is RMP-193;
 * here it only persists + reflects the active code.
 */
import { useLang, type Lang } from "./LangProvider";

export function LangToggle({ size = "sm" }: { size?: "sm" | "lg" }) {
  const { lang, setLang } = useLang();
  const big = size === "lg";

  const item = (code: Lang) => ({
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    fontSize: big ? 14 : 12.5,
    cursor: "pointer",
    padding: big ? "6px 12px" : 0,
    borderRadius: 999,
    color: lang === code ? (big ? "#fff" : "var(--fg)") : "var(--fg-3)",
    background: big && lang === code ? "var(--brand)" : "transparent",
    border: "none" as const,
  });

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: big ? 4 : 6,
        padding: big ? 3 : 0,
        borderRadius: 999,
        background: big ? "var(--bg-2)" : "transparent",
        border: big ? "1px solid var(--border)" : "none",
      }}
    >
      <button
        type="button"
        role="radio"
        style={item("EN")}
        aria-checked={lang === "EN"}
        onClick={() => setLang("EN")}
      >
        EN
      </button>
      {!big && (
        <span aria-hidden="true" style={{ color: "var(--fg-4)", fontSize: 12 }}>
          ·
        </span>
      )}
      <button
        type="button"
        role="radio"
        style={item("PT")}
        aria-checked={lang === "PT"}
        onClick={() => setLang("PT")}
      >
        PT
      </button>
    </div>
  );
}
