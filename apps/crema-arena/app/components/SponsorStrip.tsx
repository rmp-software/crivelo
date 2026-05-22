'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { CADENCE_FROZEN_MS } from '@/lib/data-cadence';
import SponsorChip from './SponsorChip';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
}

interface EventSponsor {
  id: string;
  sponsor: Sponsor;
  position: number;
}

interface SponsorStripProps {
  eventId: string;
}

// Tolerant fetcher: a failed sponsors poll must never break the live duel view.
const sponsorsFetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : null));

// Rotation tuning. With 5+ sponsors we page through windows of WINDOW_SIZE chips,
// crossfading between windows on a fixed cadence.
const WINDOW_SIZE = 4;
const ROTATE_MS = 5000;
const FADE_MS = 600;

export default function SponsorStrip({ eventId }: SponsorStripProps) {
  // Frozen-tier poll: sponsors rarely change mid-event, so this runs on its own
  // 15s loop — deliberately NOT the 1s/5s hot duel polling in LiveDisplay.
  const { data } = useSWR<EventSponsor[] | null>(
    `/api/events/${eventId}/sponsors`,
    sponsorsFetcher,
    { refreshInterval: CADENCE_FROZEN_MS, revalidateOnFocus: false }
  );

  const sponsors = useMemo(() => data ?? [], [data]);

  // Build the rotating windows. 1–4 sponsors → a single static window.
  const windows = useMemo(() => {
    if (sponsors.length === 0) return [] as EventSponsor[][];
    if (sponsors.length <= WINDOW_SIZE) return [sponsors];
    const out: EventSponsor[][] = [];
    for (let i = 0; i < sponsors.length; i += WINDOW_SIZE) {
      out.push(sponsors.slice(i, i + WINDOW_SIZE));
    }
    return out;
  }, [sponsors]);

  const [windowIndex, setWindowIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Keep the active window index valid if the sponsor count shrinks.
  useEffect(() => {
    if (windowIndex >= windows.length && windows.length > 0) {
      setWindowIndex(0);
    }
  }, [windows.length, windowIndex]);

  // Crossfade rotation, only when there's more than one window.
  useEffect(() => {
    if (windows.length <= 1) {
      setVisible(true);
      return;
    }
    let swapId: ReturnType<typeof setTimeout> | null = null;
    const id = setInterval(() => {
      setVisible(false);
      swapId = setTimeout(() => {
        setWindowIndex((i) => (i + 1) % windows.length);
        setVisible(true);
        swapId = null;
      }, FADE_MS);
    }, ROTATE_MS);
    return () => {
      clearInterval(id);
      if (swapId !== null) clearTimeout(swapId);
    };
  }, [windows.length]);

  // Hidden when no sponsors are attached.
  if (sponsors.length === 0) return null;

  const current = windows[Math.min(windowIndex, windows.length - 1)] ?? [];

  return (
    <div
      className="absolute left-0 right-0 bottom-0 z-10 flex items-center"
      style={{
        // Dark hairline band — never a cream fill (locked treatment).
        height: '5vh',
        paddingLeft: '2.9vw',
        // Right clearance so chips never slide under the fixed bottom-right QR
        // card (~460px @1080p ≈ 24vw). Scales with the viewport.
        paddingRight: '24vw',
        background: 'linear-gradient(to top, rgba(0,0,0,.35), transparent)',
        borderTop: '1px solid rgba(220,197,158,.14)',
      }}
      aria-label="Patrocinadores"
    >
      <span
        className="font-mono uppercase flex-shrink-0 text-[var(--crema-300)]"
        style={{
          fontSize: '1.05vh',
          letterSpacing: '0.28em',
          marginRight: '2.4vw',
          opacity: 0.85,
        }}
      >
        Apoio
      </span>
      <div
        className="flex items-center"
        style={{
          gap: '2.6vw',
          flex: 1,
          minWidth: 0,
          transition: `opacity ${FADE_MS}ms ease`,
          opacity: visible ? 1 : 0,
        }}
      >
        {current.map((es) => (
          <SponsorChip key={es.id} sponsor={es.sponsor} size="strip" />
        ))}
      </div>
    </div>
  );
}
