import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation helpers (RMP-193). Thin wrappers over Next's
 * navigation APIs that keep the active locale prefix in sync. The language
 * switcher uses `usePathname` + `useRouter` to round-trip between /en and /pt
 * while preserving the current path.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
