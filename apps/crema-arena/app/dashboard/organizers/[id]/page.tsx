'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import OrganizerForm, { OrganizerFormData } from '@/app/components/OrganizerForm';

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
            throw new Error('Organizer not found');
          }
          throw new Error('Failed to fetch organizer');
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
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[var(--fg-2)]">Loading organizer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Editar organizador"
        description="Update organizer information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Organizers', href: '/dashboard/organizers' },
          { label: 'Edit' },
        ]}
      />

      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-6">
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
