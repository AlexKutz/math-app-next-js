/**
 * Centralized XP (Experience Points) configuration
 * 
 * This file contains all magic numbers related to XP calculation,
 * difficulty levels, daily limits, and timing constants.
 * 
 * Using named constants instead of magic numbers improves:
 * - Code readability
 * - Maintainability
 * - Type safety
 * - Configuration flexibility
 */

export const XP_CONFIG = {
  /**
   * Base XP values for tasks based on difficulty
   * These are the default values if not specified in task config
   */
  BASE_XP: {
    EASY: 100,
    MEDIUM: 250,
    HARD: 500,
  } as const,

  /**
   * XP level thresholds
   * Cumulative XP required to reach each level (1-5)
   * Index 0 = Level 1, Index 4 = Level 5
   */
  LEVEL_THRESHOLDS: [1000, 2500, 4500, 7000, 10000] as const,

  /**
   * Daily task limits for anti-grind system
   */
  DAILY_TASKS: {
    /** Number of tasks that give full XP (100%) */
    FULL_XP: 10,
    /** Number of tasks that give half XP (50%) */
    HALF_XP: 10,
    /** Total tasks before reduced XP (10 + 10 = 20) */
    get TOTAL_BEFORE_REDUCED() {
      return this.FULL_XP + this.HALF_XP;
    },
  } as const,

  /**
   * XP multipliers for daily task progression
   */
  MULTIPLIERS: {
    /** Full XP multiplier (first 10 tasks) */
    FULL: 1.0,
    /** Half XP multiplier (next 10 tasks) */
    HALF: 0.5,
    /** Low XP multiplier (after 20 tasks) */
    LOW: 0.1,
    /** Early practice multiplier (before scheduled review) */
    EARLY: 0.1,
  } as const,

  /**
   * Spaced Repetition System (SRS) configuration
   */
  SRS: {
    /** Review intervals in days for each stage (0-4) */
    REVIEW_INTERVALS: [1, 3, 7, 14, 30] as const,
    /** Maximum mastery level (fully mastered) */
    MAX_MASTERY_LEVEL: 5,
    /** Minimum mastery level */
    MIN_MASTERY_LEVEL: 0,
  } as const,

  /**
   * XP decay settings for anti-grind
   */
  DECAY: {
    /** Daily XP decay factor */
    DAILY: 0.5,
    /** Minimum XP percentage of base */
    MIN_PERCENT: 0.1,
  } as const,

  /**
   * UI/UX timing constants (in milliseconds)
   */
  TIMING: {
    /** Delay before auto-transitioning to next task */
    TASK_TRANSITION_DELAY_MS: 2000,
    /** Progress bar animation duration (should match transition delay) */
    PROGRESS_BAR_ANIMATION_MS: 2000,
  } as const,

  /**
   * Rate limiting configuration
   */
  RATE_LIMIT: {
    /** Maximum requests per window */
    MAX_REQUESTS: 10,
    /** Time window in milliseconds (1 minute) */
    WINDOW_MS: 60 * 1000,
  } as const,

  /**
   * Input validation limits
   */
  VALIDATION: {
    /** Maximum length for user answer storage (10KB) */
    MAX_ANSWER_LENGTH: 10000,
    /** Maximum task ID length */
    MAX_TASK_ID_LENGTH: 255,
    /** Maximum topic slug length */
    MAX_TOPIC_SLUG_LENGTH: 255,
  } as const,

  /**
   * Time calculations (in milliseconds)
   */
  TIME: {
    /** Milliseconds in one second */
    MS_PER_SECOND: 1000,
    /** Milliseconds in one minute */
    MS_PER_MINUTE: 60 * 1000,
    /** Milliseconds in one hour */
    MS_PER_HOUR: 60 * 60 * 1000,
    /** Milliseconds in one day */
    MS_PER_DAY: 24 * 60 * 60 * 1000,
  } as const,

  /**
   * Database defaults (match Prisma schema defaults)
   */
  DATABASE_DEFAULTS: {
    /** Default base XP per task */
    BASE_TASK_XP: 100,
    /** Default max XP per topic */
    MAX_TOPIC_XP: 1000,
    /** Default daily full tasks */
    DAILY_FULL_TASKS: 10,
    /** Default daily half tasks */
    DAILY_HALF_TASKS: 10,
    /** Default multiplier full */
    MULTIPLIER_FULL: 1.0,
    /** Default multiplier half */
    MULTIPLIER_HALF: 0.5,
    /** Default multiplier low */
    MULTIPLIER_LOW: 0.1,
    /** Default multiplier early */
    MULTIPLIER_EARLY: 0.1,
  } as const,
} as const;

/**
 * Helper function to get base XP for a difficulty level
 */
export function getBaseXPForDifficulty(
  difficulty: string | undefined
): number {
  if (!difficulty) return XP_CONFIG.BASE_XP.EASY;
  
  const diff = difficulty.toLowerCase();
  if (diff === 'easy') return XP_CONFIG.BASE_XP.EASY;
  if (diff === 'medium' || diff === 'moderate') return XP_CONFIG.BASE_XP.MEDIUM;
  if (diff === 'hard') return XP_CONFIG.BASE_XP.HARD;
  
  return XP_CONFIG.BASE_XP.EASY;
}

/**
 * Helper function to compute level from XP
 */
export function computeLevelFromXP(currentXp: number): number {
  let achieved = 0;
  for (const threshold of XP_CONFIG.LEVEL_THRESHOLDS) {
    if (currentXp >= threshold) achieved += 1;
  }
  return Math.min(5, Math.max(0, achieved));
}

/**
 * Helper function to get daily multiplier based on task count
 */
export function getDailyMultiplier(tasksCompletedToday: number): {
  multiplier: number;
  dailyTaskIndex: number;
} {
  const idx = tasksCompletedToday + 1; // 1-based
  
  if (idx <= XP_CONFIG.DAILY_TASKS.FULL_XP) {
    return { 
      multiplier: XP_CONFIG.MULTIPLIERS.FULL, 
      dailyTaskIndex: idx 
    };
  }
  if (idx <= XP_CONFIG.DAILY_TASKS.TOTAL_BEFORE_REDUCED) {
    return { 
      multiplier: XP_CONFIG.MULTIPLIERS.HALF, 
      dailyTaskIndex: idx 
    };
  }
  return { 
    multiplier: XP_CONFIG.MULTIPLIERS.LOW, 
    dailyTaskIndex: idx 
    };
}
