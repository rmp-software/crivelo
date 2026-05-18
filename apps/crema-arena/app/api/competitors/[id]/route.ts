import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile, getFileUrl, deleteUploadedFile, getFileNameFromUrl } from '@/lib/file-upload';

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

    // Handle photo update if new photo provided
    if (photo && photo.size > 0) {
      // Save new photo
      const fileResult = await saveUploadedFile(photo);
      if (!fileResult.success || !fileResult.fileName) {
        return NextResponse.json(
          { error: fileResult.error || 'Failed to upload photo' },
          { status: 400 }
        );
      }

      // Delete old photo
      const oldFileName = getFileNameFromUrl(existingCompetitor.photo_url);
      await deleteUploadedFile(oldFileName);

      photoUrl = getFileUrl(fileResult.fileName);
    }

    // Update competitor
    const competitor = await prisma.competitor.update({
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

    // Delete photo file
    const fileName = getFileNameFromUrl(competitor.photo_url);
    await deleteUploadedFile(fileName);

    // Delete competitor (entries will be cascade deleted)
    await prisma.competitor.delete({
      where: { id: params.id },
    });

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
