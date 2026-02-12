import { NextRequest, NextResponse } from 'next/server';
import { XPService } from '@/lib/xp/xpService';
import { auth } from '@/lib/auth/authConfig';
import { TaskSubmissionSchema, validateRequest, createValidationError } from '@/lib/validation/schemas';
import { loadTaskById, validateTaskAnswer, sanitizeUserAnswer } from '@/lib/tasks/taskValidator';
import { XP_CONFIG } from '@/lib/config/xpConfig';

/**
 * Rate limiting storage (in-memory)
 * For production, use Redis or similar distributed store
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Checks if user has exceeded rate limit
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new window
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + XP_CONFIG.RATE_LIMIT.WINDOW_MS,
    });
    return true;
  }
  
  if (userLimit.count >= XP_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 },
      );
    }

    // Parse and validate request body
    const rawData = await request.json();
    const validatedData = validateRequest(TaskSubmissionSchema, rawData);
    const { taskId, topicSlug, baseXP, difficulty, userAnswer } = validatedData;

    // Load task from server-side storage (answers are not exposed to client)
    const task = await loadTaskById(taskId, topicSlug);
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 },
      );
    }

    // Validate answer server-side (security: never trust client-sent isCorrect)
    const isCorrect = validateTaskAnswer(task, userAnswer);
    
    // Sanitize user answer before storage
    const sanitizedAnswer = sanitizeUserAnswer(userAnswer);

    if (!isCorrect) {
      const { xpResult, userXP } = await XPService.submitIncorrectTask(
        session.user.id,
        taskId,
        topicSlug,
        sanitizedAnswer,
      );

      return NextResponse.json({
        success: false,
        xpResult,
        userXP,
        userAnswer: sanitizedAnswer,
        message: xpResult.message,
      });
    }

    const { xpResult, userXP } = await XPService.submitCorrectTask(
      session.user.id,
      taskId,
      topicSlug,
      baseXP ?? task.baseXP,
      difficulty ?? task.difficulty,
      sanitizedAnswer,
    );

    return NextResponse.json({
      success: true,
      xpResult,
      userXP,
      userAnswer: sanitizedAnswer,
      message: xpResult.message,
    });
  } catch (error: any) {
    console.error('Error submitting task:', error);
    
    // Handle validation errors specifically
    if (error.message?.includes('Validation failed:')) {
      return NextResponse.json(
        createValidationError(error.message),
        { status: 400 },
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 },
    );
  }
}
