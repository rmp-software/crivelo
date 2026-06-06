'use client';

import useSWR from 'swr';
import { CADENCE_FROZEN_MS } from '@/lib/data-cadence';
import SponsorChip from './SponsorChip';

interface SponsorBlockProps {
  eventId: string;
  /**
   * Current event status. When `finished`, the block relabels its heading to
   * `Patrocinado por` (the podium credit copy) so the finished
   * companion gets the credit without a second block. Anything else → `Apoio`.
   */
  eventStatus?: string;
}

interface SponsorEntry {
  id: string;
  sponsor: {
    id: string;
    name: string;
    logo_url: string | null;
    website: string | null;
  };
  position: number;
}

// Tolerant fetcher: a failed frozen-tier poll must never break the companion.
// On any non-ok response or network error we resolve to an empty list so the
// block simply hides instead of throwing into the companion's render tree.
const sponsorsFetcher = async (url: string): Promise<SponsorEntry[]> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

/**
 * Audience-companion sponsor credit ("Apoio").
 *
 * Rendered once at the bottom of the companion, below the active tab content,
 * so it appears on every tab. Frozen-tier polling (15s) via a dedicated SWR key
 * separate from the 1s/5s tab polls. Hidden entirely when there are 0 sponsors.
 *
 * Treatment (locked): cream chips on the light companion surface — each logo in
 * a `--surface-raised` chip with a 1px `--border` hairline so it separates from
 * the page. Logos shown as-is; no-logo sponsor falls back to its name in
 * `--font-display`. A sponsor with a `website` wraps in an external link.
 */
export default function SponsorBlock({ eventId, eventStatus }: SponsorBlockProps) {
  const { data } = useSWR<SponsorEntry[]>(
    `/api/events/${eventId}/sponsors`,
    sponsorsFetcher,
    { refreshInterval: CADENCE_FROZEN_MS, revalidateOnFocus: false }
  );

  const sponsors = data ?? [];
  if (sponsors.length === 0) return null;

  const isFinished = eventStatus === 'finished';
  const heading = isFinished ? 'Patrocinado por' : 'Apoio';
  // Heading style is status-aware. Running → small mono caps label ("Apoio").
  // Finished → sentence-case credit mirroring the TV podium's font-display line
  // (CLAUDE.md: sentence case for headings; only the running label is mono caps).
  const headingClassName = isFinished
    ? 'text-center text-sm font-[family-name:var(--font-display)] text-[var(--fg-3)] mb-4'
    : 'text-center text-[10px] tracking-[0.22em] uppercase font-[family-name:var(--font-mono)] text-[var(--fg-3)] mb-4';

  return (
    <section
      aria-label="Patrocinadores"
      className="border-t border-[var(--border)] px-4 py-6 mt-2"
    >
      <h2 className={headingClassName}>
        {heading}
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {sponsors.map((entry) => {
          const { sponsor } = entry;
          const chip = <SponsorChip sponsor={sponsor} size="companion" bordered />;

          if (sponsor.website) {
            return (
              <a
                key={entry.id}
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
                aria-label={sponsor.name}
              >
                {chip}
              </a>
            );
          }

          return <div key={entry.id}>{chip}</div>;
        })}
      </div>
    </section>
  );
}
