import { Metadata } from 'next';
import LiveDisplay from '@/app/components/LiveDisplay';
import LiveStage from '@/app/components/LiveStage';
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

    const eventDate = new Date(event.date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      title: `${event.name} - Live | Crema Arena`,
      description: `Watch ${event.name} live - ${eventDate}${event.location ? ` at ${event.location}` : ''}`,
      openGraph: {
        title: `${event.name} - Live`,
        description: `Watch the tournament live on ${eventDate}`,
        type: 'website',
      },
    };
  } catch (error) {
    return {
      title: 'Live Event | Crema Arena',
      description: 'Watch the tournament live',
    };
  }
}

// This is a public page - no authentication required.
// LiveStage locks the display to a 1920×1080 canvas scaled to fit any 16:9
// viewport (FHD → QHD → 4K) so the layout never re-flows, only grows.
export default function LiveEventPage({ params }: PageProps) {
  return (
    <LiveStage>
      <LiveDisplay eventId={params.eventId} />
    </LiveStage>
  );
}
