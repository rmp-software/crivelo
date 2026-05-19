'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import CompetitorForm from '@/app/components/CompetitorForm';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface CompetitorData {
  id: string;
  name: string;
  coffeeShop: string;
  photoUrl: string;
}

export default function EditCompetitorPage() {
  const params = useParams();
  const [competitor, setCompetitor] = useState<CompetitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchCompetitor = async () => {
      try {
        const response = await fetch(`/api/competitors/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Competitor not found');
          }
          throw new Error('Failed to fetch competitor');
        }

        const data = await response.json();
        setCompetitor({
          id: data.id,
          name: data.name,
          coffeeShop: data.coffeeShop,
          photoUrl: data.photoUrl,
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitor();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-[var(--fg-2)]">Carregando competidor...</p>
        </div>
      </div>
    );
  }

  if (error || !competitor) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="p-4 mb-6 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          {error || 'Competitor not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Editar competidor"
        description={`Update ${competitor.name}'s profile`}
        breadcrumbs={[
          { label: 'Competidores', href: '/dashboard/competitors' },
          { label: competitor.name },
        ]}
      />

      <CompetitorForm mode="edit" initialData={competitor} />
    </div>
  );
}
