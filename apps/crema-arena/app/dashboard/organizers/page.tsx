'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/app/components/PageHeader';
import Button from '@/app/components/Button';
import Input from '@/app/components/Input';
import Badge from '@/app/components/Badge';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

interface Organizer {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'organizer';
  createdAt: string;
}

export default function OrganizersPage() {
  const router = useRouter();
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; organizer: Organizer | null }>({
    isOpen: false,
    organizer: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrganizers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/organizers?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to view organizers');
        }
        throw new Error('Failed to fetch organizers');
      }

      const data = await response.json();
      setOrganizers(data.organizers || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, [search]);

  const handleDelete = async () => {
    if (!deleteModal.organizer) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/organizers/${deleteModal.organizer.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete organizer');
      }

      // Refresh the list
      await fetchOrganizers();
      setDeleteModal({ isOpen: false, organizer: null });
    } catch (err: any) {
      alert(err.message || 'Failed to delete organizer');
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
        title="Organizadores"
        description="Gerencie organizadores e suas permissões"
        actions={
          <Link href="/dashboard/organizers/new">
            <Button variant="primary">
              <Plus size={20} />
              Adicionar organizador
            </Button>
          </Link>
        }
      />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Buscar por nome ou email..."
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
          <p className="mt-4 text-[var(--fg-2)]">Carregando organizadores...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && organizers.length === 0 && (
        <div className="text-center py-12 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)]">
          <p className="text-xl font-medium text-[var(--fg-2)] mb-2">
            {search ? 'Nenhum organizador encontrado' : 'Nenhum organizador ainda'}
          </p>
          <p className="text-[var(--fg-3)] mb-6">
            {search
              ? 'Tente ajustar seus termos de busca'
              : 'Comece adicionando seu primeiro organizador'}
          </p>
          {!search && (
            <Link href="/dashboard/organizers/new">
              <Button variant="primary">
                <Plus size={20} />
                Adicionar organizador
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Organizers Table */}
      {!isLoading && !error && organizers.length > 0 && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-2)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-3)] uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-3)] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-3)] uppercase tracking-wider">
                    Papel
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
                {organizers.map((organizer) => (
                  <tr key={organizer.id} className="hover:bg-[var(--bg-2)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-[var(--fg)]">{organizer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--fg-2)]">
                      {organizer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={organizer.role === 'admin' ? 'success' : 'default'}>
                        {organizer.role}
                      </Badge>
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-[var(--fg-2)]">
                      {formatDate(organizer.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/organizers/${organizer.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit2 size={16} />
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteModal({ isOpen: true, organizer })}
                        >
                          <Trash2 size={16} />
                          Remover
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
            {organizers.map((organizer) => (
              <div key={organizer.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-[var(--fg)]">{organizer.name}</h3>
                    <p className="text-sm text-[var(--fg-2)] mt-1">{organizer.email}</p>
                  </div>
                  <Badge variant={organizer.role === 'admin' ? 'success' : 'default'}>
                    {organizer.role}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--fg-3)] mb-3">
                  Criado em {formatDate(organizer.createdAt)}
                </p>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/organizers/${organizer.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" fullWidth>
                      <Edit2 size={16} />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteModal({ isOpen: true, organizer })}
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
        onClose={() => setDeleteModal({ isOpen: false, organizer: null })}
        onConfirm={handleDelete}
        title="Excluir organizador"
        message={`Tem certeza que deseja excluir ${deleteModal.organizer?.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
}
