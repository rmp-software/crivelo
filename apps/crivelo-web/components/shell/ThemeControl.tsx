"use client";

/**
 * ThemeControl (RMP-190) — the Appearance segmented control: Light / Dark / System.
 *
 * Ported from coa-shell.jsx's Appearance group. Drives the shared theme
 * controller (ThemeProvider); the active segment sits on the teal accent. The
 * reference's `var(--coa)` maps to this site's `var(--brand)`.
 */
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "./icons";
import { useTheme, type ThemePref } from "./ThemeProvider";

// The second slot is the Appearance message key. Typing it as the literal union
// (not `string`) makes a typo a tsc error instead of a runtime MISSING_MESSAGE.
type AppearanceKey = "light" | "dark" | "system";

const OPTIONS: [ThemePref, AppearanceKey, IconName][] = [
  ["light", "light", "sun"],
  ["dark", "dark", "moon"],
  ["system", "system", "monitor"],
];

export function ThemeControl() {
  const { themePref, setThemePref } = useTheme();
  const t = useTranslations("Appearance");
  const tShell = useTranslations("Shell");
  return (
    <div
      role="radiogroup"
      aria-label={tShell("appearance")}
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
            {t(label)}
          </button>
        );
      })}
    </div>
  );
}
