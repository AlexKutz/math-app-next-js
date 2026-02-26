import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth/authConfig';
import { canModerate } from '@/lib/comments/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const isAdmin = await canModerate(session);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Approve comment
    const approvedComment = await prisma.comment.update({
      where: { id },
      data: {
        isApproved: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving comment:', error);
    return NextResponse.json(
      { error: 'Failed to approve comment' },
      { status: 500 }
    );
  }
}