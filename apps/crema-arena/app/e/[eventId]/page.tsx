import { Metadata } from 'next';
import LiveCompanion from '@/app/components/LiveCompanion';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: { eventId: string };
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: {
        name: true,
        date: true,
        location: true,
      },
    });

    if (!event) {
      return {
        title: 'Event Not Found | Crema Arena',
        description: 'The requested event could not be found.',
      };
    }

    const eventDate = new Date(event.date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      title: `${event.name} | Crema Arena`,
      description: `Acompanhe ${event.name} ao vivo - ${eventDate}${event.location ? ` em ${event.location}` : ''}`,
      openGraph: {
        title: event.name,
        description: `Acompanhe o torneio ao vivo em ${eventDate}`,
        type: 'website',
      },
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
    };
  } catch (error) {
    return {
      title: 'Evento | Crema Arena',
      description: 'Acompanhe o torneio ao vivo',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
    };
  }
}

// This is a public page - no authentication required, mobile-first
export default function LiveCompanionPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <LiveCompanion eventId={params.eventId} />
    </div>
  );
}
