import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth/authConfig';
import { canModerate } from '@/lib/comments/auth';

export async function GET() {
  try {
    const session = await auth();
    const isAdmin = await canModerate(session);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pendingComments = await prisma.comment.findMany({
      where: {
        isApproved: false,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const transformedComments = pendingComments.map(comment => ({
      ...comment,
      userName: comment.user.name || 'Анонімний користувач',
      userEmail: comment.user.email || 'Немає email',
    }));

    return NextResponse.json({
      comments: transformedComments,
    });
  } catch (error) {
    console.error('Error fetching pending comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending comments' },
      { status: 500 }
    );
  }
}
