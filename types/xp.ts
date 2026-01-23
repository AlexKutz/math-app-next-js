// Типи для системи досвіду з інтервальними повтореннями

export interface TopicConfig {
  slug: string;
  title: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  maxXp: number;
  tags?: string[];
  baseTaskXp: number;
  reviewIntervals: number[];
  dailyXpDecay: number;
  minXpPercent: number;

  // Optional advanced config (DB defaults are used when omitted)
  dailyFullTasks?: number;
  dailyHalfTasks?: number;
  multiplierFull?: number;
  multiplierHalf?: number;
  multiplierLow?: number;
  multiplierEarly?: number;
  levelThresholds?: number[];
}

export interface TopicXPConfig {
  id: number;
  topicSlug: string;
  topicTitle: string;
  category: string;
  description: string | null;
  difficulty: string | null;
  maxXp: number;
  baseTaskXp: number;
  dailyFullTasks: number;
  dailyHalfTasks: number;
  multiplierFull: number;
  multiplierHalf: number;
  multiplierLow: number;
  multiplierEarly: number;
  levelThresholds: number[];
  dailyXpDecay: number;
  minXpPercent: number;
  reviewIntervals: number[];
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTopicXP {
  id: number;
  userId: string;
  topicSlug: string;
  currentXp: number;
  totalXpEarned: number;
  level: number;
  lastActivity: Date;
  dailyTasksCount: number;
  dailyTasksDate: string | Date;
  srsStage: number;
  nextReviewDate: string | Date | null;
  lastPracticedDate: string | Date | null;

  // Computed (not necessarily persisted)
  nextLevelXp?: number | null;
  currentLevelMinXp?: number | null;
  createdAt: Date;
}

export interface UserTaskAttempt {
  id: number;
  userId: string;
  taskId: string;
  topicSlug: string;
  completedAt: Date;
  xpEarned: number;
  isCorrect: boolean;
  nextReviewDate: Date | null;
  reviewCount: number;
  masteryLevel: number;
}

export interface XPCalculationResult {
  xpEarned: number;
  nextReviewDate: Date | null;
  masteryLevel: number;
  reviewCount: number;
  message: string;
  isScheduledReview: boolean;

  // Anti-grind / SRS diagnostics for UI
  multiplier: number;
  dailyTaskIndex: number; // 1-based index within today's topic practice
  isTooEarly: boolean;
  isHotTopic: boolean;
}

export interface TaskSubmissionRequest {
  taskId: string;
  topicSlug: string;
  isCorrect: boolean;
  userAnswer?: any;
  baseXP?: number;
  difficulty?: string;
}

export interface TaskSubmissionResponse {
  success: boolean;
  xpResult?: XPCalculationResult;
  userXP?: UserTopicXP;
  message?: string;
  error?: string;
}

export interface TaskDueForReview {
  taskId: string;
  nextReviewDate: Date;
  masteryLevel: number;
  reviewCount: number;
}
/**
 * GET /api/xp/user?topicSlug=addition_and_subtraction_of_fractions
 * Отримати досвід користувача по темі
 */

export interface GETXpUserResponse {
  userXP: UserTopicXP;
  topicConfig: TopicXPConfig;
  completedTaskIds: string[];
}
