import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile, deleteUploadedFile } from '@/lib/file-upload';

// POST /api/duels/[id]/photo - Upload pour photo for a duel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get duel with event info
    const duel = await prisma.duel.findUnique({
      where: { id: params.id },
      include: {
        event: {
          select: {
            id: true,
            organizer_id: true,
            status: true,
          },
        },
      },
    });

    if (!duel) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
    }

    // Check authorization
    if (duel.event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo file provided' }, { status: 400 });
    }

    // Upload to Vercel Blob (validation handled inside)
    const result = await saveUploadedFile(file, `duels/${params.id}`);
    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload photo' },
        { status: 400 }
      );
    }

    // Clean up previous pour photo if any (safe no-op for legacy local paths)
    if (duel.pour_photo_url) {
      await deleteUploadedFile(duel.pour_photo_url);
    }

    const photoUrl = result.url;
    const updatedDuel = await prisma.duel.update({
      where: { id: params.id },
      data: { pour_photo_url: photoUrl },
      select: {
        id: true,
        pour_photo_url: true,
      },
    });

    return NextResponse.json({
      success: true,
      photoUrl: updatedDuel.pour_photo_url,
    });
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
