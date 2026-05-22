'use client';

import { useEffect, useState, type ReactNode } from 'react';

const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;

/**
 * Fixed 1920×1080 stage that scales uniformly to fill any 16:9 viewport.
 *
 * The TV live display is designed once at FHD; this wrapper guarantees the
 * layout is *proportionally identical* — never re-flowed — from FHD (1920×1080)
 * through QHD (2560×1440) up to 4K (3840×2160), by applying a single
 * `transform: scale(min(vw/1920, vh/1080))`.
 *
 * Everything rendered inside MUST live in 1080p stage-space (fixed px / Tailwind
 * sizes). Do NOT use viewport units (vh/vw) inside the stage — they resolve
 * against the real viewport and would double-scale against this transform.
 */
export default function LiveStage({ children }: { children: ReactNode }) {
  // null until measured on the client; we hide the stage for that first frame so
  // a small viewport never flashes the unscaled (overflowing) 1920×1080 box.
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const compute = () =>
      setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[var(--espresso-900)] flex items-center justify-center">
      <div
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          flexShrink: 0,
          transform: scale === null ? undefined : `scale(${scale})`,
          transformOrigin: 'center center',
          visibility: scale === null ? 'hidden' : 'visible',
        }}
      >
        {children}
      </div>
    </div>
  );
}
