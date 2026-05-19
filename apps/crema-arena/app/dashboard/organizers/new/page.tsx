'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import OrganizerForm, { OrganizerFormData } from '@/app/components/OrganizerForm';

export default function NewOrganizerPage() {
  const router = useRouter();

  const handleSubmit = async (data: OrganizerFormData) => {
    const response = await fetch('/api/organizers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create organizer');
    }

    // Redirect to organizers list on success
    router.push('/dashboard/organizers');
  };

  const handleCancel = () => {
    router.push('/dashboard/organizers');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Criar organizador"
        description="Adicione um novo organizador ao sistema"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Organizadores', href: '/dashboard/organizers' },
          { label: 'Novo' },
        ]}
      />

      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-6">
        <OrganizerForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
