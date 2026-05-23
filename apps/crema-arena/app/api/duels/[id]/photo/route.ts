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

    // Optional cup→competitor orientation. Defaults to "a" (entry_a = left cup),
    // reproducing the historical hard-coded assumption. Reject anything else.
    const rawLeftSlot = formData.get('leftSlot');
    let leftSlot: 'a' | 'b' = 'a';
    if (rawLeftSlot !== null && rawLeftSlot !== '') {
      if (rawLeftSlot !== 'a' && rawLeftSlot !== 'b') {
        return NextResponse.json(
          { error: 'Lado da foto inválido' },
          { status: 400 }
        );
      }
      leftSlot = rawLeftSlot;
    }

    // Upload to Vercel Blob (validation handled inside)
    const result = await saveUploadedFile(file, `duels/${params.id}`);
    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload photo' },
        { status: 400 }
      );
    }

    const photoUrl = result.url;
    const oldPhotoUrl = duel.pour_photo_url;

    let updatedDuel;
    try {
      updatedDuel = await prisma.duel.update({
        where: { id: params.id },
        data: { pour_photo_url: photoUrl, photo_left_slot: leftSlot },
        select: {
          id: true,
          pour_photo_url: true,
          photo_left_slot: true,
        },
      });
    } catch (updateError) {
      // Compensate: the DB update failed, so the just-uploaded blob is orphaned.
      // Best-effort cleanup; swallow cleanup errors so we surface the real failure below.
      try {
        await deleteUploadedFile(photoUrl);
      } catch (cleanupError) {
        console.error('Failed to cleanup orphaned duel pour photo blob:', cleanupError);
      }
      throw updateError;
    }

    // DB update succeeded: now it's safe to delete the previous pour photo (no-op for legacy paths).
    if (oldPhotoUrl) {
      try {
        await deleteUploadedFile(oldPhotoUrl);
      } catch (cleanupError) {
        console.error('Failed to delete previous duel pour photo blob:', cleanupError);
      }
    }

    return NextResponse.json({
      success: true,
      photoUrl: updatedDuel.pour_photo_url,
      photoLeftSlot: updatedDuel.photo_left_slot,
    });
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

// PATCH /api/duels/[id]/photo - Correct the cup→competitor orientation
// (photo_left_slot) without re-uploading the photo. Organizer-only.
export async function PATCH(
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

    // Check authorization (mirror POST)
    if (duel.event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Orientation only makes sense for a duel that already has a photo.
    if (!duel.pour_photo_url) {
      return NextResponse.json({ error: 'Sem foto para reorientar' }, { status: 409 });
    }

    const body = await request.json().catch(() => null);
    const leftSlot = body?.leftSlot;

    if (leftSlot !== 'a' && leftSlot !== 'b') {
      return NextResponse.json(
        { error: 'Lado da foto inválido' },
        { status: 400 }
      );
    }

    const updatedDuel = await prisma.duel.update({
      where: { id: params.id },
      data: { photo_left_slot: leftSlot },
      select: { photo_left_slot: true },
    });

    return NextResponse.json({
      success: true,
      photoLeftSlot: updatedDuel.photo_left_slot,
    });
  } catch (error: any) {
    console.error('Error updating photo orientation:', error);
    return NextResponse.json(
      { error: error.message || 'Não foi possível atualizar a orientação da foto' },
      { status: 500 }
    );
  }
}
