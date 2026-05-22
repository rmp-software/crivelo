import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { EventStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile, deleteUploadedFile } from '@/lib/file-upload';

const ALLOWED_ROLES = ['admin', 'organizer'] as const;

// GET /api/sponsors/[id] - Get single sponsor with events array
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: params.id },
      include: {
        events: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                date: true,
                status: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: sponsor.id,
      name: sponsor.name,
      logo_url: sponsor.logo_url,
      website: sponsor.website,
      events: sponsor.events.map((link) => ({
        event_sponsor_id: link.id,
        position: link.position,
        event: {
          id: link.event.id,
          name: link.event.name,
          date: link.event.date.toISOString(),
          status: link.event.status,
        },
      })),
    });
  } catch (error: any) {
    console.error('Error fetching sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsor' },
      { status: 500 }
    );
  }
}

// PATCH /api/sponsors/[id] - Update sponsor; multipart accepted for logo replacement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.sponsor.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    const data: { name?: string; logo_url?: string | null; website?: string | null } = {};

    if (formData.has('name')) {
      const rawName = formData.get('name');
      const name = typeof rawName === 'string' ? rawName.trim() : '';
      if (!name) {
        return NextResponse.json(
          { error: 'validation_error', message: 'O nome é obrigatório.' },
          { status: 422 }
        );
      }
      data.name = name;
    }

    if (formData.has('website')) {
      const rawWebsite = formData.get('website');
      const website =
        typeof rawWebsite === 'string' && rawWebsite.trim().length > 0
          ? rawWebsite.trim()
          : null;
      if (website) {
        let parsed: URL;
        try {
          parsed = new URL(website);
        } catch {
          return NextResponse.json(
            { error: 'validation_error', message: 'Site inválido.' },
            { status: 422 }
          );
        }
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json(
            { error: 'validation_error', message: 'Site inválido.' },
            { status: 422 }
          );
        }
      }
      data.website = website;
    }

    const rawLogo = formData.get('logo');
    const logo = rawLogo instanceof File ? rawLogo : null;
    let newLogoUrl: string | null = null;
    // Old blob to clean up after a successful DB update (set by replace OR remove).
    let oldLogoUrlToDelete: string | null = null;
    if (logo && logo.size > 0) {
      const fileResult = await saveUploadedFile(logo, 'sponsors');
      if (!fileResult.success || !fileResult.url) {
        return NextResponse.json(
          { error: 'validation_error', message: fileResult.error || 'Falha ao enviar o logo.' },
          { status: 422 }
        );
      }
      newLogoUrl = fileResult.url;
      data.logo_url = newLogoUrl;
      oldLogoUrlToDelete = existing.logo_url;
    } else if (formData.get('remove_logo') === '1') {
      // No replacement file: clear the persisted logo and queue the old blob for cleanup.
      data.logo_url = null;
      oldLogoUrlToDelete = existing.logo_url;
    }

    let sponsor;
    try {
      sponsor = await prisma.sponsor.update({
        where: { id: params.id },
        data,
        select: {
          id: true,
          name: true,
          logo_url: true,
          website: true,
        },
      });
    } catch (updateError) {
      // Compensate: the DB update failed, so the just-uploaded blob (if any) is orphaned.
      // Best-effort cleanup; swallow cleanup errors so we surface the real failure below.
      if (newLogoUrl) {
        try {
          await deleteUploadedFile(newLogoUrl);
        } catch (cleanupError) {
          console.error('Failed to cleanup orphaned sponsor logo blob:', cleanupError);
        }
      }
      throw updateError;
    }

    // DB update succeeded: now it's safe to delete the previous blob (set on either
    // a replace — new file uploaded — or an explicit remove_logo with no replacement).
    if (oldLogoUrlToDelete) {
      try {
        await deleteUploadedFile(oldLogoUrlToDelete);
      } catch (cleanupError) {
        // Best-effort: the DB is already updated; the old one becoming an orphan is non-fatal.
        console.error('Failed to delete previous sponsor logo blob:', cleanupError);
      }
    }

    return NextResponse.json(sponsor);
  } catch (error: any) {
    console.error('Error updating sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to update sponsor' },
      { status: 500 }
    );
  }
}

// DELETE /api/sponsors/[id] - Delete sponsor; 409 if attached to a running event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: params.id },
    });

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      );
    }

    // Soft-block: if attached to a running event, refuse.
    const running = await prisma.eventSponsor.findFirst({
      where: { sponsor_id: params.id, event: { status: EventStatus.running } },
    });

    if (running) {
      return NextResponse.json(
        {
          error: 'sponsor_in_running_event',
          message: 'Esse patrocinador está em um evento ao vivo. Remove dos eventos primeiro.',
        },
        { status: 409 }
      );
    }

    // DB-first: delete sponsor (EventSponsor rows cascade via FK), then best-effort blob cleanup.
    // If blob cleanup fails the DB row is already gone, so we don't leave a dead `logo_url` behind.
    await prisma.sponsor.delete({
      where: { id: params.id },
    });

    // Delete logo blob (safe no-op for legacy/local paths or null). Best-effort.
    try {
      await deleteUploadedFile(sponsor.logo_url);
    } catch (cleanupError) {
      console.error('Failed to delete sponsor logo blob after row removal:', cleanupError);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to delete sponsor' },
      { status: 500 }
    );
  }
}
