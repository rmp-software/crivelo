import { defineRouting } from "next-intl/routing";

/**
 * Crivelo hub i18n routing (RMP-193). English-first: `/` (or `/en`) = English,
 * `/pt` = Portuguese. The default locale is NOT prefix-hidden here — the
 * middleware redirects bare `/` to `/en` so the active locale always shows in
 * the URL (the EN/PT switcher round-trips on the prefix).
 */
export const routing = defineRouting({
  locales: ["en", "pt"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];
