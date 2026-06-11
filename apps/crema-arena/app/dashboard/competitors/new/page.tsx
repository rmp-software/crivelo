'use client';

import PageHeader from '@crivelo/ui/deprecated/PageHeader';
import CompetitorForm from '@/app/components/CompetitorForm';

export default function NewCompetitorPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Adicionar competidor"
        description="Crie um novo perfil de competidor"
        breadcrumbs={[
          { label: 'Competidores', href: '/dashboard/competitors' },
          { label: 'Novo' },
        ]}
      />

      <CompetitorForm mode="create" />
    </div>
  );
}
