"use client";

/**
 * ThemeControl (RMP-190 · RMP-210) — the Appearance segmented control:
 * Light / Dark / System.
 *
 * Ported from coa-shell.jsx's Appearance group, then rebuilt (RMP-210) on the
 * shared `@crivelo/ui` ToggleGroup (`type="single"`) — the standard
 * segmented-control primitive — replacing the hand-rolled radiogroup + inline
 * styles. Every original inline rule is now a utility class on the primitive, so
 * the control stays pixel-identical (3px container pad, rounded-full pills,
 * px-3 py-[7px] items, 13.5px semibold body type, active pill on `bg-brand`).
 *
 * It drives the shared theme controller (ThemeProvider); the active segment sits
 * on the teal accent (`var(--brand)`, the reference's `var(--coa)`).
 */
import { useTranslations } from "next-intl";
import { ToggleGroup, ToggleGroupItem } from "@crivelo/ui/toggle-group";
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
    <ToggleGroup
      type="single"
      value={themePref}
      // Radix can emit "" when an item is "deselected"; ignore the empty value so
      // a selection can never be cleared (the control is always single-active).
      onValueChange={(value) => {
        if (value) setThemePref(value as ThemePref);
      }}
      aria-label={tShell("appearance")}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-2 p-[3px]"
    >
      {OPTIONS.map(([key, label, icon]) => (
        <ToggleGroupItem
          key={key}
          value={key}
          // Pixel-identical to the original button: reset the toggleVariants
          // defaults (rounded-md → rounded-full, gap-2 → gap-1.5, h-9 px-2 →
          // px-3 py-[7px], text-sm font-medium → text-[13.5px] font-semibold),
          // drop the stock hover tint (the original had none), and map the
          // active state to the brand pill via data-[state=on]:*.
          className="h-auto min-w-0 flex-none gap-1.5 rounded-full px-3 py-[7px] font-body text-[13.5px] font-semibold text-fg-3 first:rounded-full last:rounded-full hover:bg-transparent hover:text-fg-3 data-[state=on]:bg-brand data-[state=on]:text-white data-[state=on]:hover:bg-brand data-[state=on]:hover:text-white"
        >
          {/* color follows currentColor (text-white when active) — size-[15px]
              both pins the 15px icon and opts out of the primitive's size-4. */}
          <Icon name={icon} className="size-[15px]" />
          {t(label)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
