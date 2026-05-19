'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import Input from './Input';
import { Search, UserPlus, Check } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  photoUrl: string;
  coffeeShop: string;
}

interface CompetitorPoolListProps {
  eventId: string;
  registeredCompetitorIds: string[];
  onAddCompetitor: (competitorId: string) => Promise<void>;
}

export default function CompetitorPoolList({
  eventId,
  registeredCompetitorIds,
  onAddCompetitor,
}: CompetitorPoolListProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchCompetitors = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/competitors?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch competitors');
      }

      const data = await response.json();
      setCompetitors(data.competitors || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCompetitors();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, page]);

  const handleAddCompetitor = async (competitorId: string) => {
    setAddingIds((prev) => new Set(prev).add(competitorId));

    try {
      await onAddCompetitor(competitorId);
    } catch (err: any) {
      // Error is handled by parent
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(competitorId);
        return next;
      });
    }
  };

  const isRegistered = (competitorId: string) => registeredCompetitorIds.includes(competitorId);
  const isAdding = (competitorId: string) => addingIds.has(competitorId);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--fg)] mb-2">Add Competitors</h3>
        <p className="text-sm text-[var(--fg-2)]">
          Search and select competitors from your global pool
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by name or coffee shop..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset to page 1 on search
          }}
          fullWidth
        />
        <Search
          size={20}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-3)] pointer-events-none"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)] text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && competitors.length === 0 && (
        <div className="text-center py-8 bg-[var(--bg-2)] rounded-[var(--radius-md)] border border-[var(--border)]">
          <p className="text-sm text-[var(--fg-2)]">
            {search ? 'No competitors found matching your search' : 'No competitors available'}
          </p>
        </div>
      )}

      {/* Competitors List */}
      {!isLoading && !error && competitors.length > 0 && (
        <div className="space-y-2">
          {competitors.map((competitor) => {
            const registered = isRegistered(competitor.id);
            const adding = isAdding(competitor.id);

            return (
              <div
                key={competitor.id}
                className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)] hover:border-[var(--brand)] transition-colors"
              >
                {/* Photo */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] flex-shrink-0">
                  <img
                    src={competitor.photoUrl}
                    alt={competitor.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--fg)] truncate">{competitor.name}</p>
                  <p className="text-sm text-[var(--fg-2)] truncate">{competitor.coffeeShop}</p>
                </div>

                {/* Action Button */}
                {registered ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--live)] font-medium">
                    <Check size={16} />
                    Registered
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddCompetitor(competitor.id)}
                    disabled={adding}
                  >
                    <UserPlus size={16} />
                    {adding ? 'Adding...' : 'Add'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-[var(--fg-3)]">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-[var(--fg-2)]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
