'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/app/components/PageHeader';
import Button from '@/app/components/Button';
import Input from '@/app/components/Input';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import EmptyState from '@/app/components/EmptyState';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  photoUrl: string;
  coffeeShop: string;
  createdAt: string;
}

export default function CompetitorsPage() {
  const router = useRouter();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; competitor: Competitor | null }>({
    isOpen: false,
    competitor: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompetitors = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '10');

      const response = await fetch(`/api/competitors?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to view competitors');
        }
        throw new Error('Failed to fetch competitors');
      }

      const data = await response.json();
      setCompetitors(data.competitors || []);
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
  }, [search]);

  const handleDelete = async () => {
    if (!deleteModal.competitor) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/competitors/${deleteModal.competitor.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete competitor');
      }

      // Refresh the list
      await fetchCompetitors();
      setDeleteModal({ isOpen: false, competitor: null });
    } catch (err: any) {
      alert(err.message || 'Failed to delete competitor');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Competidores"
        description="Gerencie o pool global de competidores"
        actions={
          <Link href="/dashboard/competitors/new">
            <Button variant="primary">
              <Plus size={20} />
              Adicionar competidor
            </Button>
          </Link>
        }
      />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
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
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mb-6 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-[var(--fg-2)]">Carregando competidores...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && competitors.length === 0 && (
        <EmptyState
          icon={Users}
          title={search ? 'Nenhum competidor encontrado' : 'Nenhum competidor ainda'}
          description={
            search
              ? 'Tente ajustar seus termos de busca'
              : 'Comece adicionando seu primeiro competidor'
          }
          action={
            !search
              ? {
                  label: 'Adicionar competidor',
                  onClick: () => router.push('/dashboard/competitors/new'),
                }
              : undefined
          }
        />
      )}

      {/* Competitors Table */}
      {!isLoading && !error && competitors.length > 0 && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-2)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-3)] uppercase tracking-wider">
                    Foto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-3)] uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-3)] uppercase tracking-wider">
                    Cafeteria
                  </th>
                  <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-[var(--fg-3)] uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[var(--fg-3)] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {competitors.map((competitor) => (
                  <tr
                    key={competitor.id}
                    className="hover:bg-[var(--bg-2)] transition-colors"
                    style={{
                      transitionDuration: 'var(--dur-base)',
                      transitionTimingFunction: 'var(--ease-standard)',
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)]">
                        <img
                          src={competitor.photoUrl}
                          alt={`Foto de ${competitor.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-[var(--fg)]">{competitor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--fg-2)]">
                      {competitor.coffeeShop}
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-[var(--fg-2)]">
                      <time dateTime={competitor.createdAt}>{formatDate(competitor.createdAt)}</time>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/competitors/${competitor.id}`}>
                          <Button variant="ghost" size="sm" aria-label={`Editar ${competitor.name}`}>
                            <Edit2 size={16} aria-hidden="true" />
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteModal({ isOpen: true, competitor })}
                          aria-label={`Deletar ${competitor.name}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          Deletar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="p-4">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] flex-shrink-0">
                    <img
                      src={competitor.photoUrl}
                      alt={competitor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[var(--fg)]">{competitor.name}</h3>
                    <p className="text-sm text-[var(--fg-2)] mt-1">{competitor.coffeeShop}</p>
                    <p className="text-xs text-[var(--fg-3)] mt-1">
                      Created {formatDate(competitor.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/competitors/${competitor.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" fullWidth>
                      <Edit2 size={16} />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteModal({ isOpen: true, competitor })}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, competitor: null })}
        onConfirm={handleDelete}
        title="Excluir competidor"
        message={`Are you sure you want to delete ${deleteModal.competitor?.name}? This action cannot be undone.`}
        confirmText="Excluir"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
}
