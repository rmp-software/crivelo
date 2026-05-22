'use client';

import { useState, useEffect, useMemo } from 'react';
import Button from './Button';
import Input from './Input';
import { Search, Check } from 'lucide-react';

interface PoolSponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  events_count: number;
}

interface SponsorPickerProps {
  /** Sponsor ids already attached to the event — excluded from selection. */
  attachedSponsorIds: string[];
  /**
   * Ids to pre-select. Used to re-select the ones that failed after a partial-failure
   * add so the user can retry without re-picking them.
   */
  initialSelected?: string[];
  /** Called with the ids selected, in selection order, when the user confirms. */
  onConfirm: (sponsorIds: string[]) => Promise<void>;
  onCancel: () => void;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function SponsorPicker({
  attachedSponsorIds,
  initialSelected = [],
  onConfirm,
  onCancel,
}: SponsorPickerProps) {
  const [pool, setPool] = useState<PoolSponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // Selected ids tracked in insertion order so the attach sequence matches taps.
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-sync selection when the parent hands us a new set (e.g. the failed ids to
  // retry after a partial-failure add). Joined key avoids re-running on identity.
  const initialSelectedKey = initialSelected.join(',');
  useEffect(() => {
    setSelected(initialSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedKey]);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        // The picker must reflect the live pool. GET /api/sponsors sends no Cache-Control,
        // so the browser may serve a stale cached body even with no-store; a unique query
        // param guarantees a fresh fetch.
        const response = await fetch(`/api/sponsors?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Não foi possível carregar os patrocinadores');
        const data = await response.json();
        if (active) setPool(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (active) setError(err.message || 'Ocorreu um erro');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const attachedSet = useMemo(() => new Set(attachedSponsorIds), [attachedSponsorIds]);

  const available = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pool
      .filter((s) => !attachedSet.has(s.id))
      .filter((s) => (query ? s.name.toLowerCase().includes(query) : true));
  }, [pool, attachedSet, search]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selected);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--fg-2)]">
        Busque e selecione patrocinadores do seu pool global.
      </p>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por nome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <Search
          size={20}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-3)] pointer-events-none"
        />
      </div>

      {error && (
        <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)] text-sm">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!isLoading && !error && available.length === 0 && (
        <div className="text-center py-8 bg-[var(--bg-2)] rounded-[var(--radius-md)] border border-[var(--border)]">
          <p className="text-sm text-[var(--fg-2)]">
            {search.trim()
              ? 'Nenhum patrocinador corresponde à busca.'
              : 'Nenhum patrocinador disponível no pool global.'}
          </p>
        </div>
      )}

      {!isLoading && available.length > 0 && (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {available.map((sponsor) => {
            const isSelected = selected.includes(sponsor.id);
            return (
              <button
                key={sponsor.id}
                type="button"
                onClick={() => toggle(sponsor.id)}
                aria-pressed={isSelected}
                className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] border text-left transition-colors ${
                  isSelected
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]'
                }`}
              >
                {/* Logo thumb with initials fallback */}
                <div className="w-10 h-10 flex-shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] flex items-center justify-center">
                  {sponsor.logo_url ? (
                    <img
                      src={sponsor.logo_url}
                      alt={`Logo de ${sponsor.name}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="font-display text-sm font-bold text-[var(--fg-3)]" aria-hidden="true">
                      {initials(sponsor.name) || '—'}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--fg)] truncate">{sponsor.name}</p>
                </div>

                {/* Selection indicator */}
                <div
                  className={`w-6 h-6 flex-shrink-0 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'bg-[var(--brand)] border-[var(--brand)] text-[var(--fg-inverse)]'
                      : 'border-[var(--border-strong)] text-transparent'
                  }`}
                >
                  <Check size={14} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleConfirm}
          disabled={isSubmitting || selected.length === 0}
        >
          {isSubmitting
            ? 'Adicionando...'
            : selected.length > 0
              ? `Adicionar ${selected.length}`
              : 'Adicionar'}
        </Button>
      </div>
    </div>
  );
}
