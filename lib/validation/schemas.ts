import * as v from 'valibot';

/**
 * Validation schema for task submission requests
 * Ensures data integrity and prevents injection attacks
 * Using Valibot for better performance
 * 
 * NOTE: isCorrect is NOT accepted from client - it's validated server-side
 * to prevent cheating. Never trust client-sent answer validation.
 */
export const TaskSubmissionSchema = v.object({
  taskId: v.pipe(v.string(), v.minLength(1, 'Task ID is required'), v.maxLength(255, 'Task ID is too long')),
  topicSlug: v.pipe(v.string(), v.minLength(1, 'Topic slug is required'), v.maxLength(255, 'Topic slug is too long')),
  userAnswer: v.optional(v.union([v.string(), v.number(), v.array(v.any()), v.null_()])),
  baseXP: v.optional(v.pipe(v.number(), v.minValue(1))),
  difficulty: v.optional(v.picklist(['easy', 'medium', 'hard'])),
});

/**
 * Validation schema for XP user requests
 */
export const XPUserRequestSchema = v.object({
  topicSlug: v.pipe(v.string(), v.minLength(1, 'Topic slug is required'), v.maxLength(255, 'Topic slug is too long')),
});

/**
 * Validation schema for authentication-related data
 */
export const AuthSchema = v.object({
  email: v.optional(v.pipe(v.string(), v.email('Invalid email format'))),
  credential: v.optional(v.string()),
});

/**
 * Type inference from Valibot schemas
 */
export type TaskSubmissionRequest = v.InferOutput<typeof TaskSubmissionSchema>;
export type XPUserRequest = v.InferOutput<typeof XPUserRequestSchema>;
export type AuthRequest = v.InferOutput<typeof AuthSchema>;

/**
 * Utility function to validate and parse request data
 * @param schema - Valibot schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws validation error
 */
export function validateRequest<T>(schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>, data: unknown): T {
  try {
    const result = v.safeParse(schema, data);
    if (!result.success) {
      const errorMessage = result.issues.map(issue => `${issue.path?.map(p => p.key).join('.') || 'root'}: ${issue.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    return result.output;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Validation failed: Unknown error');
  }
}

/**
 * Creates a standardized validation error response
 */
export function createValidationError(message: string) {
  return {
    success: false,
    error: message,
    validationErrors: message.includes('Validation failed:') ? message : undefined,
  };
}