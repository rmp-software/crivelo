'use client';

import PageHeader from '@/app/components/PageHeader';
import EventForm from '@/app/components/EventForm';

export default function NewEventPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Novo Evento"
        description="Crie um novo evento de competição"
      />

      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-6 md:p-8 border border-[var(--border)] shadow-[var(--shadow-1)]">
        <EventForm mode="create" />
      </div>
    </div>
  );
}
