'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Button from './Button';
import Input from './Input';
import { Search, UserPlus, Check } from 'lucide-react';

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
  /** Add a competitor optimistically — caller mutates local state before the server responds. */
  onAddCompetitor: (competitor: Competitor) => Promise<void>;
}

const POOL_LIMIT = 5;

const fetcher = async (url: string): Promise<PoolResponse> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Falha ao carregar competidores');
  return r.json();
};

export default function CompetitorPoolList({
  registeredCompetitorIds,
  onAddCompetitor,
}: CompetitorPoolListProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  // Debounce search input
  useDebounce(search, 250, setDebouncedSearch);

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

  const handleAdd = async (competitor: Competitor) => {
    setAddingIds((prev) => new Set(prev).add(competitor.id));
    try {
      await onAddCompetitor(competitor);
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(competitor.id);
        return next;
      });
    }
  };

  const isRegistered = (competitorId: string) =>
    registeredCompetitorIds.includes(competitorId);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--fg-2)]">
        Busque e selecione competidores do seu pool global.
      </p>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por nome ou cafeteria..."
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
        <div className="space-y-2">
          {competitors.map((competitor) => {
            const registered = isRegistered(competitor.id);
            const adding = addingIds.has(competitor.id);

            return (
              <div
                key={competitor.id}
                className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)] hover:border-[var(--brand)] transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] flex-shrink-0">
                  <img
                    src={competitor.photoUrl}
                    alt={competitor.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--fg)] truncate">{competitor.name}</p>
                  <p className="text-sm text-[var(--fg-2)] truncate">
                    {competitor.coffeeShop}
                  </p>
                </div>

                {registered ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--live)] font-medium">
                    <Check size={16} />
                    Inscrito
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAdd(competitor)}
                    disabled={adding}
                  >
                    <UserPlus size={16} />
                    {adding ? 'Adicionando...' : 'Inscrever'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {truncated && (
        <p className="text-xs text-[var(--fg-3)] text-center font-mono uppercase tracking-wider">
          Mostrando {competitors.length} de {total} · refine a busca
        </p>
      )}
    </div>
  );
}

// Small inline debounce hook to avoid an extra dependency.
import { useEffect } from 'react';
function useDebounce<T>(value: T, delay: number, onChange: (v: T) => void) {
  useEffect(() => {
    const t = setTimeout(() => onChange(value), delay);
    return () => clearTimeout(t);
  }, [value, delay, onChange]);
}
