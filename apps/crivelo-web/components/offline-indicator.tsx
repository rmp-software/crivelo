"use client";

/**
 * OfflineIndicator (offline / Phase 1B) — a subtle, informational badge shown
 * while the device is offline.
 *
 * The app is FULLY functional offline (recipe engine + messages are bundled,
 * saved recipes live in localStorage), so this is purely informational: no
 * blocking screen, nothing to dismiss. It tracks `navigator.onLine` plus the
 * `online`/`offline` events and renders a small pill anchored above the footer
 * only when offline; it disappears on reconnect.
 *
 * Hydration: `navigator` is unavailable on the server, so we render nothing until
 * mounted, then read the real status — the server and first client paint agree.
 * Copy resolves from the `Offline` namespace (house tokens/utilities only).
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function OfflineIndicator() {
  const t = useTranslations("Offline");
  // `offline` stays null until mounted so the server and first client paint match
  // (no hydration mismatch); the effect resolves the real status post-mount.
  const [offline, setOffline] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      // Non-interactive, unobtrusive status. `role="status"` + polite live region
      // so assistive tech announces the change without stealing focus.
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-4"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-small font-medium text-fg-2 shadow-1">
        <span aria-hidden className="size-2 rounded-full bg-fg-3" />
        {t("badge")}
      </span>
    </div>
  );
}
