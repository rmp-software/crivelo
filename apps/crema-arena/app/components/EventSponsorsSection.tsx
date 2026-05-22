'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Button from './Button';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import SponsorPicker, { initials } from './SponsorPicker';
import { useToast } from './Toast';
import { Handshake, Plus, Trash2, GripVertical } from 'lucide-react';

interface SponsorRef {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
}

interface EventSponsor {
  id: string; // EventSponsor link id (used for reorder PATCH)
  sponsor: SponsorRef;
  position: number;
}

interface EventSponsorsSectionProps {
  eventId: string;
  /** Controls are only shown in setup; running/finished render read-only. */
  canModify: boolean;
}

export default function EventSponsorsSection({ eventId, canModify }: EventSponsorsSectionProps) {
  const { showToast } = useToast();
  const [sponsors, setSponsors] = useState<EventSponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [addModal, setAddModal] = useState(false);
  const [removeModal, setRemoveModal] = useState<{ isOpen: boolean; sponsor: EventSponsor | null }>({
    isOpen: false,
    sponsor: null,
  });
  // Hold the name being removed so the confirmation body keeps it even after the
  // modal's `sponsor` is cleared on close (avoids a "Remover  deste evento?" flash).
  const removeNameRef = useRef('');
  const [isRemoving, setIsRemoving] = useState(false);

  // Ids selected in the picker that should be re-selected after a partial-failure add.
  const [retrySelection, setRetrySelection] = useState<string[]>([]);

  // Drag state — the id of the row being dragged, plus the row the cursor is
  // over and which side of it (so we can draw the insertion line in the gap).
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<'before' | 'after' | null>(null);

  const fetchSponsors = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // This endpoint sends a 15s Cache-Control for the public live/companion surfaces,
      // but the organizer dashboard must always reflect the latest order/list — a unique
      // query param plus no-store guarantees a fresh fetch.
      const response = await fetch(`/api/events/${eventId}/sponsors?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Não foi possível carregar os patrocinadores');
      const data = await response.json();
      setSponsors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const attachedSponsorIds = sponsors.map((es) => es.sponsor.id);

  const handleAdd = async (sponsorIds: string[]) => {
    // One bulk request — positions land in selection order on the server, and the
    // write is atomic, so there's no partial-success state to reconcile here.
    try {
      const response = await fetch(`/api/events/${eventId}/sponsors/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsor_ids: sponsorIds }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Falha ao adicionar patrocinadores');
      }
      await fetchSponsors();
      const count = sponsorIds.length;
      showToast(
        count === 1 ? '1 patrocinador adicionado.' : `${count} patrocinadores adicionados.`,
        'success'
      );
      setRetrySelection([]);
      setAddModal(false);
    } catch (err: any) {
      // Nothing was attached (atomic) — keep the picks selected for a retry.
      setRetrySelection(sponsorIds);
      showToast(err.message || 'Falha ao adicionar patrocinadores', 'error');
    }
  };

  const handleRemove = async () => {
    if (!removeModal.sponsor) return;
    setIsRemoving(true);
    try {
      // DELETE keys on the underlying sponsor id, not the EventSponsor link id.
      const response = await fetch(
        `/api/events/${eventId}/sponsors/${removeModal.sponsor.sponsor.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Falha ao remover patrocinador');
      }
      setRemoveModal({ isOpen: false, sponsor: null });
      await fetchSponsors();
    } catch (err: any) {
      showToast(err.message || 'Falha ao remover patrocinador', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  // Persist a reordered list: PATCH the FULL ordered list of EventSponsor ids.
  const persistOrder = async (ordered: EventSponsor[]) => {
    setSponsors(ordered); // optimistic
    try {
      const response = await fetch(`/api/events/${eventId}/sponsors`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: ordered.map((es) => es.id) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Falha ao reordenar patrocinadores');
      }
      // Resync from the server rather than trusting the in-memory optimistic
      // array — concurrent drags before this resolved can leave a stale order.
      await fetchSponsors();
    } catch (err: any) {
      // Restore the true server order on failure.
      await fetchSponsors();
      showToast(err.message || 'Falha ao reordenar patrocinadores', 'error');
    }
  };

  const handleDrop = (targetId: string, pos: 'before' | 'after', dataTransferId?: string) => {
    setDragOverId(null);
    setDragOverPos(null);
    // Prefer the id carried on the drag event's dataTransfer (always available at
    // drop time); fall back to React state for browsers that strip the payload.
    const sourceId = dataTransferId || draggingId;
    setDraggingId(null);
    if (!sourceId) return;

    const fromIndex = sponsors.findIndex((es) => es.id === sourceId);
    let toIndex = sponsors.findIndex((es) => es.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    // Land the row on the side of the target the cursor was nearest...
    if (pos === 'after') toIndex += 1;
    // ...then account for removing the source first shifting later rows down.
    if (fromIndex < toIndex) toIndex -= 1;
    if (fromIndex === toIndex) return; // dropped back into its own slot

    const reordered = [...sponsors];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    persistOrder(reordered);
  };

  return (
    <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)] mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-[var(--fg)] font-[family-name:var(--font-display)]">
            Patrocinadores deste evento
          </h3>
          <p className="text-sm text-[var(--fg-3)] mt-1">
            {sponsors.length} {sponsors.length === 1 ? 'patrocinador' : 'patrocinadores'}
          </p>
        </div>

        {canModify && (
          <Button
            variant="primary"
            onClick={() => {
              setRetrySelection([]);
              setAddModal(true);
            }}
          >
            <Plus size={20} />
            Adicionar patrocinador
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 mb-4 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : sponsors.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg)] rounded-[var(--radius-md)] border border-[var(--border)]">
          <Handshake size={32} className="mx-auto text-[var(--fg-3)] mb-3" aria-hidden="true" />
          <p className="text-[var(--fg-2)]">Nenhum patrocinador adicionado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsors.map((es) => (
            <div
              key={es.id}
              draggable={canModify}
              onDragStart={(e) => {
                if (!canModify) return;
                setDraggingId(es.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', es.id);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
                setDragOverPos(null);
              }}
              onDragOver={(e) => {
                if (!canModify) return;
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = e.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
                if (dragOverId !== es.id || dragOverPos !== pos) {
                  setDragOverId(es.id);
                  setDragOverPos(pos);
                }
              }}
              onDragLeave={() => {
                if (dragOverId === es.id) {
                  setDragOverId(null);
                  setDragOverPos(null);
                }
              }}
              onDrop={(e) => {
                if (!canModify) return;
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = e.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
                handleDrop(es.id, pos, e.dataTransfer.getData('text/plain') || undefined);
              }}
              className={`relative flex items-center gap-4 p-4 bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)] transition-colors ${
                draggingId === es.id ? 'opacity-50' : ''
              }`}
            >
              {/* Insertion line — sits in the gap to show exactly where the row lands */}
              {canModify && dragOverId === es.id && draggingId !== es.id && (
                <span
                  aria-hidden
                  className={`pointer-events-none absolute left-0 right-0 h-[2px] rounded-full bg-[var(--brand)] ${
                    dragOverPos === 'after' ? '-bottom-[7px]' : '-top-[7px]'
                  }`}
                />
              )}

              {/* Drag handle (setup only) */}
              {canModify && (
                <span
                  className="flex-shrink-0 text-[var(--fg-3)] cursor-grab active:cursor-grabbing touch-none"
                  aria-label="Arrastar para reordenar"
                  title="Arrastar para reordenar"
                >
                  <GripVertical size={20} aria-hidden="true" />
                </span>
              )}

              {/* Logo thumb with initials fallback */}
              <div className="w-12 h-12 flex-shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] flex items-center justify-center">
                {es.sponsor.logo_url ? (
                  <img
                    src={es.sponsor.logo_url}
                    alt={`Logo de ${es.sponsor.name}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="font-display text-base font-bold text-[var(--fg-3)]" aria-hidden="true">
                    {initials(es.sponsor.name) || '—'}
                  </span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[var(--fg)] truncate">{es.sponsor.name}</h4>
              </div>

              {/* Remove (setup only) */}
              {canModify && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeNameRef.current = es.sponsor.name;
                    setRemoveModal({ isOpen: true, sponsor: es });
                  }}
                  aria-label={`Remover ${es.sponsor.name}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add sponsor picker modal */}
      <Modal
        isOpen={addModal}
        onClose={() => {
          setRetrySelection([]);
          setAddModal(false);
        }}
        title="Adicionar patrocinador"
      >
        <SponsorPicker
          attachedSponsorIds={attachedSponsorIds}
          initialSelected={retrySelection}
          onConfirm={handleAdd}
          onCancel={() => {
            setRetrySelection([]);
            setAddModal(false);
          }}
        />
      </Modal>

      {/* Remove confirmation */}
      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, sponsor: null })}
        onConfirm={handleRemove}
        title="Remover patrocinador"
        message={`Remover ${removeModal.sponsor?.sponsor.name ?? removeNameRef.current} deste evento?`}
        confirmText="Remover"
        isDanger
        isLoading={isRemoving}
      />
    </div>
  );
}
