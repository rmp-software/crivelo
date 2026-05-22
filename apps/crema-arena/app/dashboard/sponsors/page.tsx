'use client';

import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/app/components/PageHeader';
import Button from '@/app/components/Button';
import Input from '@/app/components/Input';
import Modal from '@/app/components/Modal';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import EmptyState from '@/app/components/EmptyState';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import SponsorForm, { type SponsorFormData } from '@/app/components/SponsorForm';
import { useToast } from '@/app/components/Toast';
import { Plus, Search, Edit2, Trash2, Handshake } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  events_count: number;
}

function eventsLabel(count: number): string {
  return count === 1 ? 'em 1 evento' : `em ${count} eventos`;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function SponsorsPage() {
  const { showToast } = useToast();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [formModal, setFormModal] = useState<{ isOpen: boolean; sponsor: Sponsor | null }>({
    isOpen: false,
    sponsor: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; sponsor: Sponsor | null }>({
    isOpen: false,
    sponsor: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSponsors = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sponsors');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Você precisa estar logado para ver os patrocinadores');
        }
        throw new Error('Não foi possível carregar os patrocinadores');
      }

      const data = await response.json();
      setSponsors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const filteredSponsors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sponsors;
    return sponsors.filter((s) => s.name.toLowerCase().includes(query));
  }, [sponsors, search]);

  const handleFormSuccess = async () => {
    setFormModal({ isOpen: false, sponsor: null });
    showToast('Patrocinador salvo.');
    await fetchSponsors();
  };

  const handleDelete = async () => {
    if (!deleteModal.sponsor) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/sponsors/${deleteModal.sponsor.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Não foi possível excluir o patrocinador');
      }

      setDeleteModal({ isOpen: false, sponsor: null });
      await fetchSponsors();
    } catch (err: any) {
      // Surface the API error (e.g. running-event 409 spec string) via toast; keep the sponsor.
      showToast(err.message || 'Não foi possível excluir o patrocinador', 'error');
      setDeleteModal({ isOpen: false, sponsor: null });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Patrocinadores"
        description="Gerencie o pool global de patrocinadores"
        actions={
          <Button variant="primary" onClick={() => setFormModal({ isOpen: true, sponsor: null })}>
            <Plus size={20} />
            Adicionar patrocinador
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
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
          <p className="mt-4 text-[var(--fg-2)]">Carregando patrocinadores...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredSponsors.length === 0 && (
        <EmptyState
          icon={Handshake}
          title={search ? 'Nenhum patrocinador encontrado' : 'Nenhum patrocinador ainda. Cadastra o primeiro →'}
          description={search ? 'Tente ajustar seus termos de busca' : undefined}
        />
      )}

      {/* Sponsors List */}
      {!isLoading && !error && filteredSponsors.length > 0 && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
          <ul className="divide-y divide-[var(--border)]">
            {filteredSponsors.map((sponsor) => (
              <li
                key={sponsor.id}
                className="flex items-center gap-4 px-4 py-4 md:px-6 hover:bg-[var(--bg-2)] transition-colors"
                style={{
                  transitionDuration: 'var(--dur-base)',
                  transitionTimingFunction: 'var(--ease-standard)',
                }}
              >
                {/* Logo thumbnail (40×40, rounded) with initials fallback */}
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

                {/* Name + events count */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--fg)] truncate">{sponsor.name}</div>
                  <div className="text-sm text-[var(--fg-3)]">{eventsLabel(sponsor.events_count)}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormModal({ isOpen: true, sponsor })}
                    aria-label={`Editar ${sponsor.name}`}
                  >
                    <Edit2 size={16} aria-hidden="true" />
                    <span className="hidden md:inline">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteModal({ isOpen: true, sponsor })}
                    aria-label={`Excluir ${sponsor.name}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    <span className="hidden md:inline">Excluir</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, sponsor: null })}
        title={formModal.sponsor ? 'Editar patrocinador' : 'Novo patrocinador'}
      >
        <SponsorForm
          mode={formModal.sponsor ? 'edit' : 'create'}
          initialData={
            formModal.sponsor
              ? {
                  id: formModal.sponsor.id,
                  name: formModal.sponsor.name,
                  logo_url: formModal.sponsor.logo_url,
                  website: formModal.sponsor.website,
                }
              : undefined
          }
          onSuccess={handleFormSuccess}
          onCancel={() => setFormModal({ isOpen: false, sponsor: null })}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, sponsor: null })}
        onConfirm={handleDelete}
        title="Excluir patrocinador"
        message={`Tem certeza que deseja excluir ${deleteModal.sponsor?.name ?? ''}? Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
}
