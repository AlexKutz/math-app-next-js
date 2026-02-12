import { TTask, TMultipleChoiceTask, TInputTask, TCoordinatePlaneTask } from '@/types/task';
import { XP_CONFIG } from '@/lib/config/xpConfig';
import fs from 'fs';
import path from 'path';

/**
 * Server-side task validation utilities
 * These functions run only on the server to prevent answer exposure to clients
 */

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Loads a task by its ID from the content directory
 * Searches across all subject directories (math, algebra, geometry, physics)
 */
export async function loadTaskById(taskId: string, topicSlug: string): Promise<TTask | null> {
  const subjects = ['math', 'algebra', 'geometry', 'physics'];
  
  for (const subject of subjects) {
    const task = await loadTaskFromSubject(taskId, topicSlug, subject);
    if (task) return task;
  }
  
  return null;
}

/**
 * Loads a task from a specific subject directory
 */
async function loadTaskFromSubject(
  taskId: string, 
  topicSlug: string, 
  subject: string
): Promise<TTask | null> {
  const tasksDir = path.join(CONTENT_DIR, subject, topicSlug, 'tasks');
  
  if (!fs.existsSync(tasksDir)) {
    return null;
  }
  
  const files = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.json'));
  
  for (const file of files) {
    const fullPath = path.join(tasksDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    
    try {
      const data: TTask | TTask[] = JSON.parse(raw);
      const tasks = Array.isArray(data) ? data : [data];
      
      const foundTask = tasks.find((task) => task.id === taskId);
      if (foundTask) return foundTask;
    } catch (e) {
      console.error(`Error parsing task file ${file}:`, e);
    }
  }
  
  return null;
}

/**
 * Validates a user's answer against the correct answer
 * This runs server-side to prevent answer exposure
 */
export function validateTaskAnswer(task: TTask, userAnswer: unknown): boolean {
  switch (task.type) {
    case 'multiple-choice':
      return validateMultipleChoiceAnswer(task, userAnswer);
    
    case 'input':
      return validateInputAnswer(task, userAnswer);
    
    case 'coordinate-plane':
      return validateCoordinatePlaneAnswer(task, userAnswer);
    
    default:
      console.warn(`Unknown task type: ${(task as any).type}`);
      return false;
  }
}

/**
 * Validates multiple choice task answer
 */
function validateMultipleChoiceAnswer(
  task: TMultipleChoiceTask, 
  userAnswer: unknown
): boolean {
  // Expected answer is the index (number)
  if (typeof userAnswer !== 'number') {
    return false;
  }
  
  return task.answer === userAnswer;
}

/**
 * Validates input task answer
 * Supports multiple accepted answers and case-insensitive matching
 */
function validateInputAnswer(task: TInputTask, userAnswer: unknown): boolean {
  if (typeof userAnswer !== 'string') {
    return false;
  }
  
  const normalize = (s: string): string => 
    s.replace(/\s+/g, '').toLowerCase().trim();
  
  const normalizedUserAnswer = normalize(userAnswer);
  
  // Check against correct answer
  if (normalize(task.correct) === normalizedUserAnswer) {
    return true;
  }
  
  // Check against accepted alternatives
  if (Array.isArray(task.accepted)) {
    return task.accepted.some(
      (accepted) => normalize(accepted) === normalizedUserAnswer
    );
  }
  
  return false;
}

/**
 * Validates coordinate plane task answer
 * Checks if all required points are placed correctly
 */
function validateCoordinatePlaneAnswer(
  task: TCoordinatePlaneTask, 
  userAnswer: unknown
): boolean {
  // Expected format: array of {x, y} objects
  if (!Array.isArray(userAnswer)) {
    return false;
  }
  
  const points = userAnswer as Array<{ x: number; y: number }>;
  
  // Check if the number of points matches
  if (points.length !== task.correctPoints.length) {
    return false;
  }
  
  // Check if all correct points are present in user's answer
  return task.correctPoints.every((correctPoint) =>
    points.some(
      (p) => p.x === correctPoint.x && p.y === correctPoint.y
    )
  );
}

/**
 * Sanitizes user answer for storage
 * Prevents potential XSS and limits storage size
 */
export function sanitizeUserAnswer(answer: unknown): string | null {
  if (answer === null || answer === undefined) {
    return null;
  }
  
  let serialized: string;
  
  if (typeof answer === 'string') {
    serialized = answer;
  } else if (typeof answer === 'number') {
    serialized = String(answer);
  } else if (Array.isArray(answer)) {
    serialized = JSON.stringify(answer);
  } else {
    serialized = String(answer);
  }
  
  // Limit storage size to prevent abuse
  if (serialized.length > XP_CONFIG.VALIDATION.MAX_ANSWER_LENGTH) {
    console.warn(`User answer exceeded max length: ${serialized.length}`);
    serialized = serialized.substring(0, XP_CONFIG.VALIDATION.MAX_ANSWER_LENGTH);
  }
  
  // Basic XSS prevention - remove script tags and dangerous content
  // Note: This is a basic sanitization. For production, consider using DOMPurify or similar
  serialized = serialized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '');
  
  return serialized;
}

/**
 * Extracts public task data (without answers) for client-side use
 */
export function getPublicTaskData(task: TTask): Omit<TTask, 'answer' | 'correct' | 'correctPoints' | 'accepted'> {
  const { 
    answer, 
    correct, 
    correctPoints, 
    accepted, 
    ...publicData 
  } = task as any;
  
  return publicData;
}
