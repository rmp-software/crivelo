"use client";

/**
 * useWakeLock (RMP-235) — hold a screen wake lock while `active` so the phone
 * doesn't sleep mid-brew. Feature-detected; the lock is re-acquired when the
 * tab becomes visible again (the UA auto-releases it on hide) and released on
 * deactivate/unmount. Every rejection (low battery, unsupported, denied) is
 * swallowed: keeping the screen on is best-effort, never user-visible.
 */
import { useEffect } from "react";

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }
    let lock: WakeLockSentinel | null = null;
    let stopped = false;
    const acquire = () => {
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          lock = l;
          // Effect cleaned up while the request was in flight — let it go.
          if (stopped) void l.release().catch(() => undefined);
        })
        .catch(() => undefined);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };
    acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void lock?.release().catch(() => undefined);
    };
  }, [active]);
}
