import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile, deleteUploadedFile } from '@/lib/file-upload';

// GET /api/competitors/[id] - Get single competitor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const competitor = await prisma.competitor.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        photo_url: true,
        coffee_shop: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: competitor.id,
      name: competitor.name,
      photoUrl: competitor.photo_url,
      coffeeShop: competitor.coffee_shop,
      createdAt: competitor.created_at.toISOString(),
      updatedAt: competitor.updated_at.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching competitor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitor' },
      { status: 500 }
    );
  }
}

// PUT /api/competitors/[id] - Update competitor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const coffeeShop = formData.get('coffee_shop') as string;
    const photo = formData.get('photo') as File | null;

    // Validation
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Name is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!coffeeShop || coffeeShop.length < 2) {
      return NextResponse.json(
        { error: 'Coffee shop is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Check if competitor exists
    const existingCompetitor = await prisma.competitor.findUnique({
      where: { id: params.id },
    });

    if (!existingCompetitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current competitor)
    const duplicateCompetitor = await prisma.competitor.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        id: {
          not: params.id,
        },
      },
    });

    if (duplicateCompetitor) {
      return NextResponse.json(
        { error: 'A competitor with this name already exists' },
        { status: 409 }
      );
    }

    let photoUrl = existingCompetitor.photo_url;
    let newPhotoUrl: string | null = null;
    // Old blob to clean up only after a successful DB update.
    let oldPhotoUrlToDelete: string | null = null;

    // Handle photo update if new photo provided
    if (photo && photo.size > 0) {
      const fileResult = await saveUploadedFile(photo, 'competitors');
      if (!fileResult.success || !fileResult.url) {
        return NextResponse.json(
          { error: fileResult.error || 'Failed to upload photo' },
          { status: 400 }
        );
      }

      newPhotoUrl = fileResult.url;
      photoUrl = newPhotoUrl;
      oldPhotoUrlToDelete = existingCompetitor.photo_url;
    }

    // Update competitor
    let competitor;
    try {
      competitor = await prisma.competitor.update({
        where: { id: params.id },
        data: {
          name,
          coffee_shop: coffeeShop,
          photo_url: photoUrl,
        },
        select: {
          id: true,
          name: true,
          photo_url: true,
          coffee_shop: true,
          updated_at: true,
        },
      });
    } catch (updateError) {
      // Compensate: the DB update failed, so the just-uploaded blob (if any) is orphaned.
      // Best-effort cleanup; swallow cleanup errors so we surface the real failure below.
      if (newPhotoUrl) {
        try {
          await deleteUploadedFile(newPhotoUrl);
        } catch (cleanupError) {
          console.error('Failed to cleanup orphaned competitor photo blob:', cleanupError);
        }
      }
      throw updateError;
    }

    // DB update succeeded: now it's safe to delete the previous blob (safe no-op for legacy paths).
    if (oldPhotoUrlToDelete) {
      try {
        await deleteUploadedFile(oldPhotoUrlToDelete);
      } catch (cleanupError) {
        // Best-effort: the DB is already updated; the old one becoming an orphan is non-fatal.
        console.error('Failed to delete previous competitor photo blob:', cleanupError);
      }
    }

    return NextResponse.json({
      id: competitor.id,
      name: competitor.name,
      photoUrl: competitor.photo_url,
      coffeeShop: competitor.coffee_shop,
      updatedAt: competitor.updated_at.toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating competitor:', error);
    return NextResponse.json(
      { error: 'Failed to update competitor' },
      { status: 500 }
    );
  }
}

// DELETE /api/competitors/[id] - Delete competitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if competitor exists
    const competitor = await prisma.competitor.findUnique({
      where: { id: params.id },
      include: {
        entries: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Check for active event participation (events that are not finished)
    const hasActiveEntries = competitor.entries.some(
      (entry) => entry.event.status !== 'finished'
    );

    if (hasActiveEntries) {
      return NextResponse.json(
        { error: 'Competitor has active event participation and cannot be deleted' },
        { status: 409 }
      );
    }

    // DB-first: delete competitor (entries cascade), then best-effort blob cleanup.
    // If blob cleanup fails the row is already gone, so we don't leave a dead `photo_url`.
    await prisma.competitor.delete({
      where: { id: params.id },
    });

    // Delete photo from Blob (no-op for legacy local paths or null). Best-effort.
    try {
      await deleteUploadedFile(competitor.photo_url);
    } catch (cleanupError) {
      console.error('Failed to delete competitor photo blob after row removal:', cleanupError);
    }

    return NextResponse.json({
      success: true,
      message: 'Competitor deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting competitor:', error);
    return NextResponse.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    );
  }
}
