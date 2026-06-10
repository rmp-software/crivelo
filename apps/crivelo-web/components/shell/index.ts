/**
 * Crivelo shell (RMP-190) — sticky header, left-sliding family nav sheet, footer,
 * plus the theme (Light/Dark/System) + language (EN/PT) controllers.
 *
 * Ported from docs/design/coa-v60/project/coa-shell.jsx + the theme/lang/menu
 * ownership in coa-home.jsx. Wrap a page in <Shell> (inside the server layout's
 * <body>); the layout supplies the no-FOUC script via NO_FOUC_SCRIPT.
 */
export { Shell } from "./Shell";
export { Header } from "./Header";
export { NavSheet } from "./NavSheet";
export { Footer } from "./Footer";
export { ThemeControl } from "./ThemeControl";
export { LangToggle } from "./LangToggle";

export { ThemeProvider, useTheme, NO_FOUC_SCRIPT } from "./ThemeProvider";
export type { ThemePref, ResolvedTheme } from "./ThemeProvider";
export { LangProvider, useLang } from "./LangProvider";
export type { Lang } from "./LangProvider";

export { NAV_ITEMS, CREMA_ARENA_URL } from "./nav";
export type { NavItem } from "./nav";
