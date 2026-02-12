import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/authConfig';
import { XPService } from '@/lib/xp/xpService';
import { XPUserRequestSchema, validateRequest, createValidationError } from '@/lib/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topicSlug = searchParams.get('topicSlug');

    // Validate query parameters
    const queryParams = { topicSlug };
    const validatedParams = validateRequest(XPUserRequestSchema, queryParams);
    const validatedTopicSlug = validatedParams.topicSlug;

    console.log('Fetching XP for user:', session.user.id, 'topic:', validatedTopicSlug);

    const userXP = await XPService.getUserTopicXP(session.user.id, validatedTopicSlug);
    const topicConfig = await XPService.getTopicConfig(validatedTopicSlug);
    const completedTaskIds = await XPService.getCompletedTaskIds(
      session.user.id,
      validatedTopicSlug,
    );

    return NextResponse.json({ userXP, topicConfig, completedTaskIds });
  } catch (error: any) {
    console.error('Error fetching user XP:', error);
    
    // Handle validation errors specifically
    if (error.message?.includes('Validation failed:')) {
      return NextResponse.json(
        createValidationError(error.message),
        { status: 400 },
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
