'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Button from './Button';
import Input from './Input';
import { Search, Check } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  photoUrl: string;
  coffeeShop: string;
}

interface PoolResponse {
  competitors: Competitor[];
  total: number;
  page: number;
}

interface CompetitorPoolListProps {
  registeredCompetitorIds: string[];
  /**
   * Competitors to pre-select. Used to re-select the ones that failed after a
   * partial-failure add so the user can retry without re-picking them.
   */
  initialSelected?: Competitor[];
  /** Called with the selected competitors, in selection order, when the user confirms. */
  onConfirm: (competitors: Competitor[]) => Promise<void>;
  onCancel: () => void;
}

const POOL_LIMIT = 5;

const fetcher = async (url: string): Promise<PoolResponse> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Falha ao carregar competidores');
  return r.json();
};

export default function CompetitorPoolList({
  registeredCompetitorIds,
  initialSelected = [],
  onConfirm,
  onCancel,
}: CompetitorPoolListProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Selected competitors held as full objects (in selection order) so the batch
  // confirm works even for picks scrolled out of the server-paginated pool view.
  const [selected, setSelected] = useState<Competitor[]>(initialSelected);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search input
  useDebounce(search, 250, setDebouncedSearch);

  // Re-sync selection when the parent hands us a new set (e.g. the failed ones
  // to retry after a partial-failure add). Joined key avoids re-running on identity.
  const initialSelectedKey = initialSelected.map((c) => c.id).join(',');
  useEffect(() => {
    setSelected(initialSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedKey]);

  const params = new URLSearchParams();
  if (debouncedSearch) params.append('search', debouncedSearch);
  params.append('limit', String(POOL_LIMIT));
  const swrKey = `/api/competitors?${params.toString()}`;

  const { data, error, isLoading } = useSWR<PoolResponse>(swrKey, fetcher, {
    keepPreviousData: true,
  });

  const competitors = data?.competitors ?? [];
  const total = data?.total ?? 0;
  const truncated = total > competitors.length;

  const registeredSet = new Set(registeredCompetitorIds);
  const selectedIds = new Set(selected.map((c) => c.id));

  const toggle = (competitor: Competitor) => {
    setSelected((prev) =>
      prev.some((c) => c.id === competitor.id)
        ? prev.filter((c) => c.id !== competitor.id)
        : [...prev, competitor]
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
        Busque e selecione competidores do seu pool global.
      </p>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por nome ou cafeteria"
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
          {error.message}
        </div>
      )}

      {isLoading && !data && (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!isLoading && competitors.length === 0 && (
        <div className="text-center py-8 bg-[var(--bg-2)] rounded-[var(--radius-md)] border border-[var(--border)]">
          <p className="text-sm text-[var(--fg-2)]">
            {debouncedSearch
              ? 'Nenhum competidor corresponde à busca.'
              : 'Nenhum competidor no pool global.'}
          </p>
        </div>
      )}

      {competitors.length > 0 && (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {competitors.map((competitor) => {
            const registered = registeredSet.has(competitor.id);
            const isSelected = selectedIds.has(competitor.id);

            // Already inscribed in this event → locked, not selectable.
            if (registered) {
              return (
                <div
                  key={competitor.id}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] opacity-60"
                >
                  <Thumb competitor={competitor} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--fg)] truncate">{competitor.name}</p>
                    <p className="text-sm text-[var(--fg-2)] truncate">{competitor.coffeeShop}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--live)] font-medium">
                    <Check size={16} />
                    Inscrito
                  </div>
                </div>
              );
            }

            return (
              <button
                key={competitor.id}
                type="button"
                onClick={() => toggle(competitor)}
                aria-pressed={isSelected}
                className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] border text-left transition-colors ${
                  isSelected
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]'
                }`}
              >
                <Thumb competitor={competitor} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--fg)] truncate">{competitor.name}</p>
                  <p className="text-sm text-[var(--fg-2)] truncate">{competitor.coffeeShop}</p>
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

      {truncated && (
        <p className="text-xs text-[var(--fg-3)] text-center font-mono uppercase tracking-wider">
          Mostrando {competitors.length} de {total} · refine a busca
        </p>
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
            ? 'Inscrevendo...'
            : selected.length > 0
              ? `Inscrever ${selected.length}`
              : 'Inscrever'}
        </Button>
      </div>
    </div>
  );
}

function Thumb({ competitor }: { competitor: Competitor }) {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] flex-shrink-0">
      <img src={competitor.photoUrl} alt={competitor.name} className="w-full h-full object-cover" />
    </div>
  );
}

// Small inline debounce hook to avoid an extra dependency.
function useDebounce<T>(value: T, delay: number, onChange: (v: T) => void) {
  useEffect(() => {
    const t = setTimeout(() => onChange(value), delay);
    return () => clearTimeout(t);
  }, [value, delay, onChange]);
}
