import type { CSSProperties } from 'react';

/**
 * Shared cream-chip used to credit a sponsor across every surface (locked
 * treatment): a `--surface-raised` rounded card holding the logo
 * (`object-fit: contain`, shown as-is) or — when there's no logo — the sponsor
 * name in `--font-display`. The cream chip normalizes any logo regardless of
 * its own color / transparency / aspect.
 *
 * Three consumers, three sizings (`size` enum):
 * - `strip`   — TV running strip (~30px logo). Fixed 1080p stage-space px; the
 *               LiveStage transform scales it identically from FHD up to 4K.
 * - `podium`  — TV finished podium credit (~32px logo). Tailwind-class sized.
 * - `companion` — audience companion (~56px logo). Tailwind-class sized, and the
 *               only light-surface consumer, so it sets `bordered` for a 1px
 *               `--border` hairline. Heavier name text uses `--fg-2`.
 *
 * Dark surfaces (strip, podium) don't set `bordered`; their name fallback uses
 * `--espresso-900` for contrast against the cream chip.
 */

interface SponsorChipSponsor {
  name: string;
  logo_url: string | null;
}

type SponsorChipSize = 'strip' | 'podium' | 'companion';

interface SponsorChipProps {
  sponsor: SponsorChipSponsor;
  size: SponsorChipSize;
  /** Light surfaces (companion) add a 1px `--border` hairline. Default false. */
  bordered?: boolean;
}

export default function SponsorChip({ sponsor, size, bordered = false }: SponsorChipProps) {
  // The TV strip is sized in 1080p stage-space px (inline styles) so it scales
  // with the LiveStage transform; the podium and companion are Tailwind-class
  // sized. Each branch reproduces the exact pre-refactor look.
  if (size === 'strip') {
    const chipStyle: CSSProperties = {
      // Chip ~44px tall, sitting within the ~54px band; all 1080p stage-space px.
      height: 44,
      paddingLeft: 19,
      paddingRight: 19,
      maxWidth: 230,
      boxShadow: '0 2px 11px -4px rgba(0,0,0,.5)',
    };

    return (
      <div
        className="flex items-center justify-center flex-shrink-0 bg-[var(--surface-raised)] rounded-[var(--radius-sm)]"
        style={chipStyle}
      >
        {sponsor.logo_url ? (
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            style={{
              // Logo ~30px inside the ~44px chip — shown as-is, no grayscale.
              height: 30,
              width: 'auto',
              maxWidth: 192,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : (
          <span
            className="font-display font-semibold text-[var(--espresso-900)] truncate"
            style={{ fontSize: 18, maxWidth: 192 }}
          >
            {sponsor.name}
          </span>
        )}
      </div>
    );
  }

  if (size === 'podium') {
    return (
      <div className="flex items-center justify-center h-12 md:h-14 px-3 md:px-4 bg-[var(--surface-raised)] rounded-[var(--radius-sm)] shadow-[var(--shadow-1)]">
        {sponsor.logo_url ? (
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            className="max-h-[28px] md:max-h-[32px] w-auto max-w-[140px] object-contain"
          />
        ) : (
          <span className="font-display font-bold text-sm md:text-base text-[var(--espresso-900)] whitespace-nowrap">
            {sponsor.name}
          </span>
        )}
      </div>
    );
  }

  // companion
  return (
    <div
      className={`flex items-center justify-center h-14 px-4 bg-[var(--surface-raised)] rounded-[var(--radius-sm)] ${
        bordered ? 'border border-[var(--border)]' : ''
      }`}
    >
      {sponsor.logo_url ? (
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className="max-h-[56px] w-auto max-w-[160px] object-contain"
        />
      ) : (
        <span className="font-[family-name:var(--font-display)] font-bold text-sm text-[var(--fg-2)] whitespace-nowrap">
          {sponsor.name}
        </span>
      )}
    </div>
  );
}
