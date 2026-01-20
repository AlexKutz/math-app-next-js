import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/authConfig';
import { XPService } from '@/lib/xp/xpService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topicSlug = searchParams.get('topicSlug');

    if (!topicSlug) {
      return NextResponse.json(
        { error: 'topicSlug is required' },
        { status: 400 },
      );
    }

    console.log('Fetching XP for user:', session.user.id, 'topic:', topicSlug);

    const userXP = await XPService.getUserTopicXP(session.user.id, topicSlug);
    const topicConfig = await XPService.getTopicConfig(topicSlug);
    const completedTaskIds = await XPService.getCompletedTaskIds(
      session.user.id,
      topicSlug,
    );

    return NextResponse.json({ userXP, topicConfig, completedTaskIds });
  } catch (error) {
    console.error('Error fetching user XP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
