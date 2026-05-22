import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile } from '@/lib/file-upload';

const ALLOWED_ROLES = ['admin', 'organizer'] as const;

// GET /api/sponsors - List sponsors with events_count
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sponsors = await prisma.sponsor.findMany({
      include: { _count: { select: { events: true } } },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(
      sponsors.map((s) => ({
        id: s.id,
        name: s.name,
        logo_url: s.logo_url,
        website: s.website,
        events_count: s._count.events,
      }))
    );
  } catch (error: any) {
    console.error('Error fetching sponsors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsors' },
      { status: 500 }
    );
  }
}

// POST /api/sponsors - Create sponsor (multipart, optional logo)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const rawName = formData.get('name');
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    const rawWebsite = formData.get('website');
    const website =
      typeof rawWebsite === 'string' && rawWebsite.trim().length > 0
        ? rawWebsite.trim()
        : null;
    const rawLogo = formData.get('logo');
    const logo = rawLogo instanceof File ? rawLogo : null;

    // Validation: name required
    if (!name) {
      return NextResponse.json(
        { error: 'validation_error', message: 'O nome é obrigatório.' },
        { status: 422 }
      );
    }

    // Validation: website URL parseable + http(s) only when provided
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

    let logoUrl: string | null = null;

    if (logo && logo.size > 0) {
      const fileResult = await saveUploadedFile(logo, 'sponsors');
      if (!fileResult.success || !fileResult.url) {
        return NextResponse.json(
          { error: 'validation_error', message: fileResult.error || 'Falha ao enviar o logo.' },
          { status: 422 }
        );
      }
      logoUrl = fileResult.url;
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        name,
        logo_url: logoUrl,
        website,
      },
      select: {
        id: true,
        name: true,
        logo_url: true,
        website: true,
      },
    });

    return NextResponse.json(sponsor, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to create sponsor' },
      { status: 500 }
    );
  }
}
