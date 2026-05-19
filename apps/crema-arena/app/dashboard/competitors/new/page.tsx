'use client';

import PageHeader from '@/app/components/PageHeader';
import CompetitorForm from '@/app/components/CompetitorForm';

export default function NewCompetitorPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Adicionar competidor"
        description="Create a new competitor profile"
        breadcrumbs={[
          { label: 'Competidores', href: '/dashboard/competitors' },
          { label: 'New' },
        ]}
      />

      <CompetitorForm mode="create" />
    </div>
  );
}
