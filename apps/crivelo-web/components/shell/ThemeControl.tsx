"use client";

/**
 * ThemeControl (RMP-190) — the Appearance segmented control: Light / Dark / System.
 *
 * Ported from coa-shell.jsx's Appearance group. Drives the shared theme
 * controller (ThemeProvider); the active segment sits on the teal accent. The
 * reference's `var(--coa)` maps to this site's `var(--brand)`.
 */
import { Icon, type IconName } from "./icons";
import { useTheme, type ThemePref } from "./ThemeProvider";

const OPTIONS: [ThemePref, string, IconName][] = [
  ["light", "Light", "sun"],
  ["dark", "Dark", "moon"],
  ["system", "System", "monitor"],
];

export function ThemeControl() {
  const { themePref, setThemePref } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: 3,
        borderRadius: 999,
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
      }}
    >
      {OPTIONS.map(([key, label, icon]) => {
        const on = themePref === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setThemePref(key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              cursor: "pointer",
              borderRadius: 999,
              padding: "7px 12px",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 13.5,
              background: on ? "var(--brand)" : "transparent",
              color: on ? "#fff" : "var(--fg-3)",
            }}
          >
            <Icon name={icon} size={15} color={on ? "#fff" : "var(--fg-3)"} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
