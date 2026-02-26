import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth/authConfig';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subject: string; topic: string }> }
) {
  try {
    const { subject, topic } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    
    const session = await auth();
    const userId = session?.user?.id;

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'likes') {
      orderBy.likes = 'desc';
      orderBy.createdAt = 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch ALL comments (both top-level and replies) with pagination
    const skip = (page - 1) * limit;
    
    const allComments = await prisma.comment.findMany({
      where: {
        subject,
        topicSlug: topic,
        isApproved: true,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' }, // Newest first
        { id: 'desc' } // Stable sorting
      ],
      skip,
      take: limit,
    });

    // Transform and organize comments with proper depth calculation
    const transformedComments = allComments.map((comment: any) => {
      // Calculate actual depth by traversing up the parent chain
      let depth = 0;
      let currentParentId = comment.parentId;
      
      while (currentParentId && depth < 10) { // Prevent infinite loops
        const parent = allComments.find(c => c.id === currentParentId);
        if (parent) {
          depth++;
          currentParentId = parent.parentId;
        } else {
          break;
        }
      }
      
      return {
        ...comment,
        userName: comment.user?.name || 'Анонімний користувач',
        userImage: comment.user?.image || null,
        currentUserLiked: false, // TODO: Implement like tracking
        depth: depth, // Actual nesting depth
        replies: [], // Keep empty for flattened structure
      };
    });

    // Check if there are more comments
    const totalComments = await prisma.comment.count({
      where: {
        subject,
        topicSlug: topic,
        isApproved: true,
        isDeleted: false,
      },
    });

    const hasMore = skip + limit < totalComments;

    return NextResponse.json({
      comments: transformedComments,
      hasMore,
      totalCount: totalComments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ subject: string; topic: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, topic } = await params;
    const { content, parentId } = await request.json();

    // Validate input
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Content is too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Rate limiting check
    // TODO: Implement rate limiting when Redis is configured
    
    // Spam detection
    const { detectSpam } = await import('@/lib/comments/spam-filter');
    if (detectSpam(content)) {
      return NextResponse.json(
        { error: 'Comment flagged as spam' },
        { status: 400 }
      );
    }

    // Validate parent comment exists if provided
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      
      if (!parentComment || parentComment.subject !== subject || parentComment.topicSlug !== topic) {
        return NextResponse.json(
          { error: 'Invalid parent comment' },
          { status: 400 }
        );
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        subject,
        topicSlug: topic,
        content: content.trim(),
        parentId: parentId || null,
        isApproved: true, // Auto-approve for now, can be changed based on moderation settings
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...comment,
      userName: comment.user?.name || 'Анонімний користувач',
      userImage: comment.user?.image || null,
      currentUserLiked: false,
      replies: [], // New comments start with no replies
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
