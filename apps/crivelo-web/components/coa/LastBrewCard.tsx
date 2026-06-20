"use client";

/**
 * LastBrewCard (feature: coa-save-recipes) — the home/idle "Last brew" card.
 *
 * Surfaces the most recently completed brew (the implicit `coa-last-brew` slot) so it
 * can be re-launched without re-dialing the inputs. It renders ONLY when a last brew
 * exists; with an empty slot it renders nothing, so the calculator looks exactly as it
 * did before this feature.
 *
 *  - **Client-only after mount.** `getLastBrew()` reads `localStorage`, which is null on
 *    the server. Rendering it during SSR would either always omit the card (stale) or
 *    trip a hydration mismatch when the client read disagrees with the server's null.
 *    We therefore read in an effect behind a `mounted` flag: the server and the first
 *    client paint both render nothing (matching markup → no hydration error), then the
 *    card appears on the post-mount commit. This mirrors how `BrewView` defers its
 *    `localStorage`-driven timer to a client-only mount.
 *  - **Two actions, both via the shared nav helpers** (no hand-built query strings):
 *    "Brew again" → `brewHref(params, false)` (autostart=0 → lands on the brew route's
 *    "ready" state), "Edit" → `editHref(params)` (the calculator pre-filled with these
 *    params). Routed through the locale-aware `useRouter` so the active locale prefix is
 *    preserved.
 *
 * Styling: house tokens/utilities only (no raw hex / no inline `var()`). The card matches
 * the calculator's existing raised surfaces (`bg-surface-raised`, `border-border`,
 * `rounded-md`, `shadow-1`); the params summary reuses `doseRatioSummary` + the localized
 * taste label (single source of truth — the summary is never re-derived here).
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { Button } from "../ui/Button";
import { useRouter } from "../../i18n/navigation";
import { brewHref, editHref } from "../../lib/coa-nav";
import { getLastBrew, type LastBrew } from "../../lib/recipes-store";
import { paramsSummary } from "../../lib/recipe-summary";
import { tasteKey } from "../../lib/four-six";
import { Icon } from "./icons";
import { CAP, CARD_PILL_SOLID, CARD_PILL_OUTLINE, MONO } from "./style-tokens";

export function LastBrewCard() {
  const t = useTranslations("LastBrew");
  const tTaste = useTranslations("Taste");
  const router = useRouter();

  // `coa-last-brew` lives in localStorage (null on the server). Read it only after
  // mount so the server + first client paint agree (both render null) — no hydration
  // mismatch — then reveal the card on the post-mount commit.
  const [lastBrew, setLastBrew] = useState<LastBrew | null>(null);
  useEffect(() => {
    setLastBrew(getLastBrew());
  }, []);

  if (!lastBrew) return null;

  const { params } = lastBrew;
  // Localized taste descriptor appended to the language-agnostic dose/ratio half.
  const summary = paramsSummary(params, tTaste(tasteKey(params.acidity)));

  return (
    <section
      className="mb-5 rounded-md border border-border bg-surface-raised p-5 shadow-1"
      aria-label={t("title")}
    >
      <div className={cn(CAP, "mb-2")}>{t("title")}</div>
      <div className={cn("mb-4 text-body text-fg-2", MONO)}>{summary}</div>
      <div className="flex gap-2.5">
        <Button
          onClick={() => router.push(brewHref(params, false))}
          className={CARD_PILL_SOLID}
        >
          <Icon name="play" size={16} /> {t("brewAgain")}
        </Button>
        <Button
          onClick={() => router.push(editHref(params))}
          className={CARD_PILL_OUTLINE}
        >
          {t("edit")}
        </Button>
      </div>
    </section>
  );
}
