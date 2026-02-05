import { TTask } from '@/types/task';
import { TaskSubmissionResponse, UserTopicXP, TopicXPConfig } from '@/types/xp';

export const TASK_TRANSITION_DELAY = 2000;
export const IS_AUTO_TRANSITION = true;

export type DateLike = Date | string | null | undefined;

export interface EnergyCalculation {
  fullTasksRemaining: number;
  halfTasksRemaining: number;
  totalRemaining: number;
  totalAvailable: number;
  dailyCount: number;
  isHotTopic: boolean;
  percentRemaining: number;
}

export const getTodayDateString = (): string => new Date().toISOString().slice(0, 10);

export const isHotTopic = (nextReviewDate: DateLike): boolean => {
  if (!nextReviewDate) return true;
  const today = getTodayDateString();
  return new Date(nextReviewDate).toISOString().slice(0, 10) <= today;
};

export const isNewDay = (dailyTasksDate: DateLike): boolean => {
  if (!dailyTasksDate) return true;
  const today = getTodayDateString();
  const lastDate = new Date(dailyTasksDate).toISOString().slice(0, 10);
  return lastDate !== today;
};

export const calculateEnergyStats = (
  userXP: UserTopicXP,
  topicConfig: TopicXPConfig,
): EnergyCalculation => {
  const hotTopic = isHotTopic(userXP.nextReviewDate);
  const newDay = isNewDay(userXP.dailyTasksDate);
  const dailyCount = newDay || hotTopic ? 0 : userXP.dailyTasksCount;

  const totalAvailable =
    topicConfig.dailyFullTasks + topicConfig.dailyHalfTasks;
  const fullTasksRemaining = Math.max(
    0,
    topicConfig.dailyFullTasks - dailyCount,
  );
  const halfTasksRemaining = Math.max(0, totalAvailable - dailyCount);
  const totalRemaining = Math.max(0, totalAvailable - dailyCount);
  const percentRemaining = Math.min(
    100,
    (totalRemaining / totalAvailable) * 100,
  );

  return {
    fullTasksRemaining,
    halfTasksRemaining,
    totalRemaining,
    totalAvailable,
    dailyCount,
    isHotTopic: hotTopic,
    percentRemaining,
  };
};

export const getEnergyBarColor = (percentRemaining: number): string => {
  if (percentRemaining > 66) return 'bg-green-500';
  if (percentRemaining > 33) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const getEnergyStatusText = (energy: EnergyCalculation): string => {
  if (energy.isHotTopic && energy.dailyCount === 0) {
    return 'Повна енергія 🔋';
  }
  if (energy.fullTasksRemaining > 0) {
    return `${energy.fullTasksRemaining} задач з повним XP`;
  }
  if (energy.halfTasksRemaining > 0) {
    return `${energy.halfTasksRemaining} задач з 50% XP`;
  }
  return 'Енергія вичерпана ⚡';
};

export const formatTimeUntilReview = (nextReviewDate: Date): string => {
  const now = new Date();
  const diffMs = nextReviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'завтра';
  if (diffDays <= 7) return `через ${diffDays} дні`;
  return nextReviewDate.toLocaleDateString('uk-UA');
};

export const findNextUnattemptedTask = (
  tasks: TTask[],
  startIndex: number,
  completedTaskIds: Set<string>,
  submissionResults: Record<string, TaskSubmissionResponse>,
  excludeTaskId?: string,
): number => {
  // First, look for tasks after the current index
  const nextIndex = tasks.findIndex(
    (task, idx) =>
      idx > startIndex &&
      !completedTaskIds.has(task.id) &&
      !submissionResults[task.id],
  );

  if (nextIndex !== -1) return nextIndex;

  // If no task found after current, look from the beginning
  return tasks.findIndex(
    (task) =>
      !completedTaskIds.has(task.id) &&
      !submissionResults[task.id] &&
      task.id !== excludeTaskId,
  );
};

export const checkTaskAnswer = (task: TTask, answer: unknown): boolean => {
  if (task.type === 'multiple-choice') {
    return task.answer === answer;
  }
  if (task.type === 'input') {
    return task.correct === answer;
  }
  if (task.type === 'coordinate-plane') {
    const points = answer as Array<{ x: number; y: number }>;
    if (!Array.isArray(points) || points.length !== task.correctPoints.length) {
      return false;
    }
    return task.correctPoints.every((correctPoint) =>
      points.some((p) => p.x === correctPoint.x && p.y === correctPoint.y)
    );
  }
  return false;
};
