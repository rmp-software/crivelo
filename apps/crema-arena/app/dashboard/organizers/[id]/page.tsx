'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@crivelo/ui/page-header';
import OrganizerForm, { OrganizerFormData } from '@/app/components/OrganizerForm';
import { Spinner } from '@crivelo/ui/spinner';

export default function EditOrganizerPage() {
  const router = useRouter();
  const params = useParams();
  const organizerId = params.id as string;

  const [initialData, setInitialData] = useState<Partial<OrganizerFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchOrganizer = async () => {
      try {
        const response = await fetch(`/api/organizers/${organizerId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Organizador não encontrado');
          }
          throw new Error('Falha ao carregar organizador');
        }

        const data = await response.json();
        setInitialData({
          name: data.name,
          email: data.email,
          role: data.role,
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizer();
  }, [organizerId]);

  const handleSubmit = async (data: OrganizerFormData) => {
    const response = await fetch(`/api/organizers/${organizerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update organizer');
    }

    // Redirect to organizers list on success
    router.push('/dashboard/organizers');
  };

  const handleCancel = () => {
    router.push('/dashboard/organizers');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-fg-2">Carregando organizador...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-4 rounded-sm bg-danger-soft border border-danger text-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Editar organizador"
        description="Atualize os dados do organizador"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Organizadores', href: '/dashboard/organizers' },
          { label: 'Editar' },
        ]}
      />

      <div className="bg-surface rounded-lg border border-border p-6">
        {initialData && (
          <OrganizerForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit
          />
        )}
      </div>
    </div>
  );
}
