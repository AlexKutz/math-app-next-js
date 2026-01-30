import { NextRequest, NextResponse } from 'next/server';
import { XPService } from '@/lib/xp/xpService';
import { TaskSubmissionRequest } from '@/types/xp';
import { auth } from '@/lib/auth/authConfig';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body: TaskSubmissionRequest = await request.json();
    const { taskId, topicSlug, isCorrect, baseXP, difficulty, userAnswer } = body;

    if (!taskId || !topicSlug) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (!isCorrect) {
      const { xpResult, userXP } = await XPService.submitIncorrectTask(
        session.user.id,
        taskId,
        topicSlug,
        userAnswer,
      );

      return NextResponse.json({
        success: false,
        xpResult,
        userXP,
        userAnswer,
        message: xpResult.message,
      });
    }

    const { xpResult, userXP } = await XPService.submitCorrectTask(
      session.user.id,
      taskId,
      topicSlug,
      baseXP,
      difficulty,
      userAnswer,
    );

    return NextResponse.json({
      success: true,
      xpResult,
      userXP,
      userAnswer,
      message: xpResult.message,
    });
  } catch (error: any) {
    console.error('Error submitting task:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 },
    );
  }
}
