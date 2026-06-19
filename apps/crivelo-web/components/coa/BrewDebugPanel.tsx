"use client";

/**
 * BrewDebugPanel — a dev-only floating control to accelerate the brew clock so a
 * full 3:30 brew can be exercised in seconds instead of minutes. Rendered only in
 * non-production environments (gated by IS_DEBUG_ENV at the BrewTimer call site)
 * and code-split via `next/dynamic`, so it never ships to real users.
 *
 * The chosen multiplier scales BrewTimer's live wall-clock delta only; recipe
 * math and every displayed time stay truthful (10× just makes a 3:30 brew play
 * in ~21s). Labels are English by design — this is a developer tool, not a
 * user-facing surface.
 */
import { cn } from "@crivelo/ui/lib/utils";
import { Button } from "../ui/Button";
import { BREW_SPEEDS, type BrewSpeed } from "./brew-speed";

export interface BrewDebugPanelProps {
  speed: BrewSpeed;
  onSpeedChange: (speed: BrewSpeed) => void;
}

export function BrewDebugPanel({ speed, onSpeedChange }: BrewDebugPanelProps) {
  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2 rounded-md border border-border-strong bg-surface-raised p-3 shadow-1">
      <div className="flex items-center gap-2">
        <span className="rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
          Dev
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3">
          Brew speed
        </span>
      </div>
      <div className="flex gap-1.5">
        {BREW_SPEEDS.map((s) => {
          const active = speed === s;
          return (
            <Button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              aria-pressed={active}
              className={cn(
                "h-8 min-w-11 cursor-pointer rounded-md border px-2 font-mono text-small font-semibold tabular-nums shadow-none",
                active
                  ? "border-brand bg-brand text-white hover:bg-brand"
                  : "border-border-strong bg-transparent text-fg-2 hover:bg-transparent hover:text-fg",
              )}
            >
              {s}×
            </Button>
          );
        })}
      </div>
    </div>
  );
}
