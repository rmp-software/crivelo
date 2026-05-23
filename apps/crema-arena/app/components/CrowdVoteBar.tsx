'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from './Toast';
import {
  getOrCreateDeviceId,
  getSelectedSide,
  setSelectedSide,
  clearSelectedSide,
  type CrowdSide,
} from '@/lib/device-id';
import type { Duel } from './tabs/AoVivoTab';

interface CrowdVoteBarProps {
  duel: Duel;
}

// The audience companion crowd-vote ballot (RMP-128). Unofficial: the judges
// decide the duel. Rendered by AoVivoTab only when crowd vote is enabled and the
// current duel has both entries.
//
// Two layouts:
//  - photo present  → the pour photo IS the ballot: split into left/right tap
//    zones with the correct name overlaid per cup (resolved via photoLeftSlot).
//  - no photo       → two named profile cards in entry order (A left, B right).
//
// Voting is optimistic: the tapped side highlights immediately and the local
// tally bumps, then reconciles to the authoritative counts the server returns.
// The selected side is persisted per duel in localStorage so a reload keeps it.
export default function CrowdVoteBar({ duel }: CrowdVoteBarProps) {
  const { showToast } = useToast();

  const entryA = duel.entryA;
  const entryB = duel.entryB;
  const photoLeftSlot: CrowdSide = duel.photoLeftSlot === 'b' ? 'b' : 'a';
  const hasPhoto = !!duel.pourPhotoUrl;
  const isOpen = duel.status === 'in_progress';

  // Server-authoritative counts from the poll. Optimistic deltas layer on top.
  const serverA = duel.crowdVotesA ?? 0;
  const serverB = duel.crowdVotesB ?? 0;

  // The device's selected side. Seeded from localStorage on mount (per duel).
  const [selected, setSelected] = useState<CrowdSide | null>(null);
  // Optimistic counts shown while a cast is in flight; null = trust the poll.
  const [optimistic, setOptimistic] = useState<{ a: number; b: number } | null>(null);
  const [pending, setPending] = useState(false);
  // Tracks the in-flight request so a stale response can't clobber a newer tap.
  const reqIdRef = useRef(0);

  // Seed the persisted selection once we know the duel id (client only).
  useEffect(() => {
    setSelected(getSelectedSide(duel.id));
    // A new duel id means a fresh ballot — clear any optimistic state.
    setOptimistic(null);
  }, [duel.id]);

  // Whenever a fresh poll arrives, drop optimistic state and trust the server.
  // The poll is the source of truth for the tally; our own pick stays in
  // `selected` (persisted), so the highlight survives the reconcile.
  useEffect(() => {
    setOptimistic(null);
  }, [serverA, serverB]);

  const counts = optimistic ?? { a: serverA, b: serverB };
  const total = counts.a + counts.b;
  const shareA = total > 0 ? Math.round((counts.a / total) * 100) : 0;

  // Resolve which entry sits on the left/right cup of the photo.
  const leftEntry = photoLeftSlot === 'b' ? entryB : entryA;
  const rightEntry = photoLeftSlot === 'b' ? entryA : entryB;
  // Side ('a'/'b') a given cup position casts for.
  const leftSide: CrowdSide = photoLeftSlot === 'b' ? 'b' : 'a';
  const rightSide: CrowdSide = photoLeftSlot === 'b' ? 'a' : 'b';

  const selectedName = useMemo(() => {
    if (!selected) return null;
    const entry = selected === 'a' ? entryA : entryB;
    return entry?.competitor.name ?? null;
  }, [selected, entryA, entryB]);

  async function cast(side: CrowdSide) {
    if (!isOpen || pending) return;
    if (selected === side) return; // already on this side — no-op

    // Optimistic: move the local count from the previous side (if any) to the
    // new side and highlight immediately.
    const prevSelected = selected;
    const base = optimistic ?? { a: serverA, b: serverB };
    const next = { a: base.a, b: base.b };
    if (prevSelected === 'a') next.a = Math.max(0, next.a - 1);
    if (prevSelected === 'b') next.b = Math.max(0, next.b - 1);
    if (side === 'a') next.a += 1;
    else next.b += 1;

    const myReq = ++reqIdRef.current;
    setSelected(side);
    setSelectedSide(duel.id, side);
    setOptimistic(next);
    setPending(true);

    try {
      const res = await fetch(`/api/duels/${duel.id}/crowd-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side, deviceId: getOrCreateDeviceId() }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // Revert optimistic state and restore-or-clear the previous selection.
        // On a failed FIRST vote (prevSelected null) we must REMOVE the key we
        // wrote optimistically, else a reload would show a selection with no
        // server vote behind it.
        if (myReq === reqIdRef.current) {
          setSelected(prevSelected);
          if (prevSelected) setSelectedSide(duel.id, prevSelected);
          else clearSelectedSide(duel.id);
          setOptimistic(null);
        }
        const message =
          (data && typeof data.error === 'string' && data.error) ||
          'Não foi possível registrar o voto.';
        showToast(message, 'error');
        return;
      }

      // Reconcile to the authoritative counts + persisted side from the server.
      if (myReq === reqIdRef.current && data) {
        const yourSide: CrowdSide = data.yourSide === 'b' ? 'b' : 'a';
        setSelected(yourSide);
        setSelectedSide(duel.id, yourSide);
        setOptimistic({
          a: typeof data.crowdVotesA === 'number' ? data.crowdVotesA : next.a,
          b: typeof data.crowdVotesB === 'number' ? data.crowdVotesB : next.b,
        });
      }
    } catch {
      if (myReq === reqIdRef.current) {
        setSelected(prevSelected);
        if (prevSelected) setSelectedSide(duel.id, prevSelected);
        else clearSelectedSide(duel.id);
        setOptimistic(null);
      }
      showToast('Não foi possível registrar o voto.', 'error');
    } finally {
      if (myReq === reqIdRef.current) setPending(false);
    }
  }

  return (
    <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-1)] p-4">
      {/* Label + unofficial disclaimer */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-3)] font-[family-name:var(--font-mono)]">
          Voto do público
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--fg-3)] font-[family-name:var(--font-mono)] opacity-70">
          · não oficial
        </span>
      </div>
      <p className="text-xs text-[var(--fg-3)] mb-3">
        Quem decide o duelo são os jurados.
      </p>

      {/* Ballot */}
      {hasPhoto ? (
        <div className="relative rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border)]">
          <img
            src={duel.pourPhotoUrl!}
            alt="Duelo"
            className="w-full aspect-video object-cover"
          />
          {/* Tap zones overlaid on the single photo, split by a hairline */}
          <div className="absolute inset-0 grid grid-cols-2">
            <CupZone
              entryName={leftEntry?.competitor.name ?? null}
              selected={selected === leftSide}
              dimmed={!!selected && selected !== leftSide}
              disabled={!isOpen || !leftEntry || pending}
              align="left"
              onTap={() => leftEntry && cast(leftSide)}
            />
            <CupZone
              entryName={rightEntry?.competitor.name ?? null}
              selected={selected === rightSide}
              dimmed={!!selected && selected !== rightSide}
              disabled={!isOpen || !rightEntry || pending}
              align="right"
              onTap={() => rightEntry && cast(rightSide)}
            />
          </div>
          {/* Hairline divider down the middle */}
          <div
            className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-[var(--fg-inverse)]/40"
            aria-hidden
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <CardZone
            entry={entryA}
            selected={selected === 'a'}
            dimmed={selected === 'b'}
            disabled={!isOpen || !entryA || pending}
            onTap={() => entryA && cast('a')}
          />
          <CardZone
            entry={entryB}
            selected={selected === 'b'}
            dimmed={selected === 'a'}
            disabled={!isOpen || !entryB || pending}
            onTap={() => entryB && cast('b')}
          />
        </div>
      )}

      {/* Tally: lean bar + mono N × M */}
      <div className="mt-3">
        <div className="h-2 rounded-[var(--radius-full)] bg-[var(--bg-2)] overflow-hidden flex">
          {total > 0 && (
            <>
              <div
                className="h-full bg-[var(--brand)] transition-all"
                style={{ width: `${shareA}%` }}
                aria-hidden
              />
              <div
                className="h-full bg-[var(--fg-3)] transition-all"
                style={{ width: `${100 - shareA}%` }}
                aria-hidden
              />
            </>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          {total > 0 ? (
            <span className="text-sm font-semibold tabular-nums text-[var(--fg)] font-[family-name:var(--font-mono)]">
              {counts.a} × {counts.b}
            </span>
          ) : isOpen ? (
            <span className="text-xs text-[var(--fg-3)]">Seja o primeiro a votar</span>
          ) : (
            <span />
          )}
          {!isOpen && (
            <span className="text-xs font-medium text-[var(--fg-3)]">
              Votação encerrada.
            </span>
          )}
        </div>
      </div>

      {/* Post-vote caption — persists after close so a voter still sees their pick */}
      {(isOpen || !!selected) && selectedName && (
        <p className="text-xs text-[var(--fg-2)] mt-2">
          {hasPhoto
            ? `Você votou no copo de ${selectedName}`
            : `Você votou em ${selectedName}`}
        </p>
      )}
    </div>
  );
}

function CupZone({
  entryName,
  selected,
  dimmed,
  disabled,
  align,
  onTap,
}: {
  entryName: string | null;
  selected: boolean;
  dimmed: boolean;
  disabled: boolean;
  align: 'left' | 'right';
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={entryName ? `Votar no copo de ${entryName}` : undefined}
      className={`relative flex flex-col justify-end p-3 min-h-[44px] transition-all touch-manipulation ${
        align === 'right' ? 'items-end text-right' : 'items-start text-left'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'} ${
        selected ? 'ring-2 ring-inset ring-[var(--brand)] bg-[var(--brand)]/10' : ''
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      {entryName && (
        <span className="text-[var(--fg-inverse)] text-sm font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate max-w-full">
          {selected && <span aria-hidden>▸ </span>}
          {entryName}
        </span>
      )}
    </button>
  );
}

function CardZone({
  entry,
  selected,
  dimmed,
  disabled,
  onTap,
}: {
  entry: Duel['entryA'];
  selected: boolean;
  dimmed: boolean;
  disabled: boolean;
  onTap: () => void;
}) {
  if (!entry) {
    return (
      <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-2)] p-4 flex items-center justify-center text-xs text-[var(--fg-3)] min-h-[44px]">
        —
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`Votar em ${entry.competitor.name}`}
      className={`rounded-[var(--radius-sm)] border p-4 flex flex-col items-center text-center min-h-[44px] transition-all touch-manipulation ${
        disabled ? 'cursor-default' : 'cursor-pointer'
      } ${
        selected
          ? 'border-[var(--brand)] ring-2 ring-[var(--brand)] bg-[var(--brand-soft)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] mb-2">
        <img
          src={entry.competitor.photoUrl}
          alt={entry.competitor.name}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="font-semibold text-sm text-[var(--fg)] line-clamp-2 leading-tight">
        {selected && <span aria-hidden>▸ </span>}
        {entry.competitor.name}
      </p>
      <p className="text-xs text-[var(--fg-3)] line-clamp-1 mt-0.5">
        {entry.competitor.coffeeShop}
      </p>
    </button>
  );
}
