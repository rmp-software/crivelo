import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

// GET /api/organizers - List organizers with search and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
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
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [organizers, total] = await Promise.all([
      prisma.organizer.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.organizer.count({ where }),
    ]);

    return NextResponse.json({
      organizers: organizers.map((org) => ({
        id: org.id,
        name: org.name,
        email: org.email,
        role: org.role,
        createdAt: org.created_at.toISOString(),
      })),
      total,
      page,
    });
  } catch (error: any) {
    console.error('Error fetching organizers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizers' },
      { status: 500 }
    );
  }
}

// POST /api/organizers - Create new organizer
export async function POST(request: NextRequest) {
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
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
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

    // Check for duplicate email
    const existingOrganizer = await prisma.organizer.findUnique({
      where: { email },
    });

    if (existingOrganizer) {
      return NextResponse.json(
        { error: 'An organizer with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create organizer
    const organizer = await prisma.organizer.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      id: organizer.id,
      name: organizer.name,
      email: organizer.email,
      role: organizer.role,
      createdAt: organizer.created_at.toISOString(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organizer:', error);
    return NextResponse.json(
      { error: 'Failed to create organizer' },
      { status: 500 }
    );
  }
}
