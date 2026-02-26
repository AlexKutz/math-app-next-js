import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth/authConfig';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json(); // 'like' or 'unlike'

    // Validate action
    if (action !== 'like' && action !== 'unlike') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Check if comment exists and get its current state
    const comment = await prisma.comment.findUnique({
      where: { id, isDeleted: false },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Prevent users from liking their own comments
    if (comment.userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot like your own comment' },
        { status: 400 }
      );
    }

    // Запобігаємо падінню лайків нижче 0 ДО того, як робити запит в базу
    if (action === 'unlike' && comment.likes <= 0) {
      return NextResponse.json({
        likes: 0,
        currentUserLiked: false,
      });
    }

    const increment = action === 'like' ? 1 : -1;
    
    // Prisma повертає вже ОНОВЛЕНИЙ об'єкт
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        likes: {
          increment: increment,
        },
      },
    });

    // Віддаємо точну цифру з бази, без повторного додавання/віднімання
    return NextResponse.json({
      likes: updatedComment.likes,
      currentUserLiked: action === 'like',
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { error: 'Failed to like comment' },
      { status: 500 }
    );
  }
}