'use client';

import { useEffect, useState } from 'react';
import { useToast } from './Toast';

interface SeedInputProps {
  entryId: string;
  eventId: string;
  seed: number | null;
  onSaved: (seed: number | null) => void;
}

/**
 * Inline editable cabeça-de-chave (seed) input. Saves on blur / Enter.
 * Optimistic locally; revalidates the server response on success and rolls
 * back on conflict.
 */
export default function SeedInput({ entryId, eventId, seed, onSaved }: SeedInputProps) {
  const { showToast } = useToast();
  const [value, setValue] = useState(seed?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const initial = seed?.toString() ?? '';

  // Reset when the parent prop changes (e.g. after refetch).
  useEffect(() => {
    setValue(seed?.toString() ?? '');
  }, [seed, entryId]);

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === initial) return; // no change

    const parsed = trimmed === '' ? null : Number(trimmed);
    if (trimmed !== '' && (!Number.isInteger(parsed) || parsed! < 1)) {
      showToast('Cabeça-de-chave deve ser um inteiro positivo', 'error');
      setValue(initial);
      return;
    }

    setSaving(true);
    // Optimistic update upstream
    onSaved(parsed);

    try {
      const r = await fetch(`/api/events/${eventId}/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: parsed }),
      });
      const data = await r.json();
      if (!r.ok) {
        // Rollback
        onSaved(seed);
        setValue(initial);
        showToast(data.error || 'Falha ao salvar cabeça-de-chave', 'error');
        return;
      }
      onSaved(data.seed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="flex flex-col items-center gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
        Seed
      </span>
      <input
        type="number"
        min={1}
        inputMode="numeric"
        placeholder="—"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setValue(initial);
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        disabled={saving}
        className="w-14 text-center px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg)] font-mono text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--brand)] disabled:opacity-50"
      />
    </label>
  );
}
