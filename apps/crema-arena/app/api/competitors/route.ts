import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile, deleteUploadedFile } from '@/lib/file-upload';

// GET /api/competitors - List competitors with search and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { coffee_shop: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [competitors, total] = await Promise.all([
      prisma.competitor.findMany({
        where,
        select: {
          id: true,
          name: true,
          photo_url: true,
          coffee_shop: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.competitor.count({ where }),
    ]);

    return NextResponse.json({
      competitors: competitors.map((comp) => ({
        id: comp.id,
        name: comp.name,
        photoUrl: comp.photo_url,
        coffeeShop: comp.coffee_shop,
        createdAt: comp.created_at.toISOString(),
      })),
      total,
      page,
    });
  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}

// POST /api/competitors - Create new competitor
export async function POST(request: NextRequest) {
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

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo is required' },
        { status: 400 }
      );
    }

    // Check for duplicate name (optional)
    const existingCompetitor = await prisma.competitor.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCompetitor) {
      return NextResponse.json(
        { error: 'A competitor with this name already exists' },
        { status: 409 }
      );
    }

    // Save photo to Vercel Blob
    const fileResult = await saveUploadedFile(photo, 'competitors');
    if (!fileResult.success || !fileResult.url) {
      return NextResponse.json(
        { error: fileResult.error || 'Failed to upload photo' },
        { status: 400 }
      );
    }

    const photoUrl = fileResult.url;

    // Create competitor
    let competitor;
    try {
      competitor = await prisma.competitor.create({
        data: {
          name,
          coffee_shop: coffeeShop,
          photo_url: photoUrl,
          created_by: session.user.id,
        },
        select: {
          id: true,
          name: true,
          photo_url: true,
          coffee_shop: true,
          created_at: true,
        },
      });
    } catch (createError) {
      // Compensate: the DB create failed, so the just-uploaded photo blob is orphaned.
      // Best-effort cleanup; swallow cleanup errors so we surface the real failure below.
      try {
        await deleteUploadedFile(photoUrl);
      } catch (cleanupError) {
        console.error('Failed to cleanup orphaned competitor photo blob:', cleanupError);
      }
      throw createError;
    }

    return NextResponse.json({
      id: competitor.id,
      name: competitor.name,
      photoUrl: competitor.photo_url,
      coffeeShop: competitor.coffee_shop,
      createdAt: competitor.created_at.toISOString(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating competitor:', error);
    return NextResponse.json(
      { error: 'Failed to create competitor' },
      { status: 500 }
    );
  }
}
