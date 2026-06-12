'use client';

import { PageHeader } from '@crivelo/ui/page-header';
import EventForm from '@/app/components/EventForm';

export default function NewEventPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Novo evento"
        description="Crie um novo evento de competição"
      />

      <div className="bg-surface-raised rounded-lg p-6 md:p-8 border border-border shadow-1">
        <EventForm mode="create" />
      </div>
    </div>
  );
}
