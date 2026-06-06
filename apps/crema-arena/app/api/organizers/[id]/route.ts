import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

// GET /api/organizers/[id] - Get single organizer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const organizer = await prisma.organizer.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    if (!organizer) {
      return NextResponse.json({ error: 'Organizer not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: organizer.id,
      name: organizer.name,
      email: organizer.email,
      role: organizer.role,
      createdAt: organizer.created_at.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching organizer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizer' },
      { status: 500 }
    );
  }
}

// PUT /api/organizers/[id] - Update organizer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validation
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!['admin', 'organizer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or organizer' },
        { status: 400 }
      );
    }

    // Check if organizer exists
    const existingOrganizer = await prisma.organizer.findUnique({
      where: { id: params.id },
    });

    if (!existingOrganizer) {
      return NextResponse.json({ error: 'Organizer not found' }, { status: 404 });
    }

    // Prevent demoting last admin
    if (existingOrganizer.role === 'admin' && role !== 'admin') {
      const adminCount = await prisma.organizer.count({
        where: { role: 'admin' },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot change role - at least one admin must remain' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate email (if email is being changed)
    if (email !== existingOrganizer.email) {
      const emailExists = await prisma.organizer.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'An organizer with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role,
    };

    // Only update password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // Update organizer
    const organizer = await prisma.organizer.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      id: organizer.id,
      name: organizer.name,
      email: organizer.email,
      role: organizer.role,
      updatedAt: organizer.updated_at.toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating organizer:', error);
    return NextResponse.json(
      { error: 'Failed to update organizer' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizers/[id] - Delete organizer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Prevent self-deletion
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if organizer exists
    const organizer = await prisma.organizer.findUnique({
      where: { id: params.id },
    });

    if (!organizer) {
      return NextResponse.json({ error: 'Organizer not found' }, { status: 404 });
    }

    // Prevent deleting last admin
    if (organizer.role === 'admin') {
      const adminCount = await prisma.organizer.count({
        where: { role: 'admin' },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin account' },
          { status: 400 }
        );
      }
    }

    // Delete organizer
    await prisma.organizer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting organizer:', error);
    return NextResponse.json(
      { error: 'Failed to delete organizer' },
      { status: 500 }
    );
  }
}
