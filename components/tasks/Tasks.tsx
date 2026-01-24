'use client';

import { TMultipleChoiceTask, TInputTask, TTask } from '@/types/task';
import { MultipleChoiceTask } from './MultipleChoiceTask';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { InputTask } from './InputTask';
import { useSession } from 'next-auth/react';
import { TaskSubmissionResponse, UserTopicXP, TopicXPConfig } from '@/types/xp';
import { GETXpUserResponse as UserXPResponse } from '@/types/xp';

// ============================================================================
// Constants
// ============================================================================
const TASK_TRANSITION_DELAY = 1500;
const IS_AUTO_TRANSITION = false;

// ============================================================================
// Types
// ============================================================================
interface TaskNavigationProps {
  tasks: TTask[];
  currentTaskIndex: number;
  submissionResults: Record<string, TaskSubmissionResponse>;
  onSelectTask: (index: number) => void;
}

interface UserXPDisplayProps {
  userXP: UserTopicXP;
  topicConfig: TopicXPConfig | null;
}

interface TaskResultDisplayProps {
  result: TaskSubmissionResponse;
}

interface SuccessScreenProps {
  isAuthenticated: boolean;
  nextReviewDate?: DateLike;
}

interface EnergyCalculation {
  fullTasksRemaining: number;
  halfTasksRemaining: number;
  totalRemaining: number;
  totalAvailable: number;
  dailyCount: number;
  isHotTopic: boolean;
  percentRemaining: number;
}

// ============================================================================
// Utility Functions
// ============================================================================
type DateLike = Date | string | null | undefined;

const getTodayDateString = (): string => new Date().toISOString().slice(0, 10);

const isHotTopic = (nextReviewDate: DateLike): boolean => {
  if (!nextReviewDate) return true;
  const today = getTodayDateString();
  return new Date(nextReviewDate).toISOString().slice(0, 10) <= today;
};

const isNewDay = (dailyTasksDate: DateLike): boolean => {
  if (!dailyTasksDate) return true;
  const today = getTodayDateString();
  const lastDate = new Date(dailyTasksDate).toISOString().slice(0, 10);
  return lastDate !== today;
};

const calculateEnergyStats = (
  userXP: UserTopicXP,
  topicConfig: TopicXPConfig,
): EnergyCalculation => {
  const hotTopic = isHotTopic(userXP.nextReviewDate);
  const newDay = isNewDay(userXP.dailyTasksDate);
  const dailyCount = newDay || hotTopic ? 0 : userXP.dailyTasksCount;
  
  const totalAvailable = topicConfig.dailyFullTasks + topicConfig.dailyHalfTasks;
  const fullTasksRemaining = Math.max(0, topicConfig.dailyFullTasks - dailyCount);
  const halfTasksRemaining = Math.max(0, totalAvailable - dailyCount);
  const totalRemaining = Math.max(0, totalAvailable - dailyCount);
  const percentRemaining = Math.min(100, (totalRemaining / totalAvailable) * 100);

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

const getEnergyBarColor = (percentRemaining: number): string => {
  if (percentRemaining > 66) return 'bg-green-500';
  if (percentRemaining > 33) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getEnergyStatusText = (energy: EnergyCalculation): string => {
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

const formatTimeUntilReview = (nextReviewDate: Date): string => {
  const now = new Date();
  const diffMs = nextReviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'завтра';
  if (diffDays <= 7) return `через ${diffDays} дні`;
  return nextReviewDate.toLocaleDateString('uk-UA');
};

const findNextUnattemptedTask = (
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

const checkTaskAnswer = (task: TTask, answer: unknown): boolean => {
  if (task.type === 'multiple-choice') {
    return task.answer === answer;
  }
  if (task.type === 'input') {
    return task.correct === answer;
  }
  return false;
};

// ============================================================================
// Sub-Components
// ============================================================================
const TaskNavigation = ({
  tasks,
  currentTaskIndex,
  submissionResults,
  onSelectTask,
}: TaskNavigationProps) => {
  return (
    <div className='mb-6 flex flex-wrap gap-2'>
      {tasks.map((task, index) => {
        const submission = submissionResults[task.id];
        const isCorrect = submission?.success === true;
        const isIncorrect = submission?.success === false;
        const isCurrent = index === currentTaskIndex;

        const baseStyles = 'flex pointer h-10 w-10 items-center justify-center rounded-md border text-sm font-bold transition-all';
        const statusStyles = isCorrect
          ? 'border-green-600 bg-green-500 text-white'
          : isIncorrect
            ? 'border-red-600 bg-red-500 text-white'
            : 'border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300';
        const currentStyles = isCurrent ? 'scale-110 ring-2 ring-blue-500' : 'hover:scale-105';

        return (
          <button
            key={task.id}
            onClick={() => onSelectTask(index)}
            className={`${baseStyles} ${statusStyles} ${currentStyles}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
};

const EnergyBar = ({ userXP, topicConfig }: { userXP: UserTopicXP; topicConfig: TopicXPConfig }) => {
  const energy = useMemo(() => calculateEnergyStats(userXP, topicConfig), [userXP, topicConfig]);
  
  return (
    <div className='mb-2'>
      <div className='mb-1 flex items-center justify-between text-xs'>
        <span className='text-gray-600 dark:text-gray-400'>Енергія теми</span>
        <span className='font-medium'>{getEnergyStatusText(energy)}</span>
      </div>
      <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getEnergyBarColor(energy.percentRemaining)}`}
          style={{ width: `${energy.percentRemaining}%` }}
        />
      </div>
    </div>
  );
};

const XPProgressBar = ({ userXP }: { userXP: UserTopicXP }) => {
  const progressPercent = useMemo(() => {
    if (typeof userXP.nextLevelXp !== 'number' || typeof userXP.currentLevelMinXp !== 'number') {
      return 100;
    }
    const range = userXP.nextLevelXp - userXP.currentLevelMinXp;
    const progress = userXP.currentXp - userXP.currentLevelMinXp;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }, [userXP.currentXp, userXP.nextLevelXp, userXP.currentLevelMinXp]);

  return (
    <div className='mb-2'>
      <div className='mb-1 flex justify-between text-sm'>
        <span>{userXP.currentXp} XP</span>
        <span>{typeof userXP.nextLevelXp === 'number' ? `${userXP.nextLevelXp} XP` : 'MAX'}</span>
      </div>
      <div className='h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
        <div
          className='h-2.5 rounded-full bg-linear-to-r from-blue-600 to-purple-600 transition-all duration-500'
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

const UserXPDisplay = ({ userXP, topicConfig }: UserXPDisplayProps) => {
  const isHot = isHotTopic(userXP.nextReviewDate);
  const hasUpcomingReview = userXP.nextReviewDate && new Date(userXP.nextReviewDate) > new Date();

  const containerStyles = isHot
    ? 'bg-linear-to-r from-amber-50 to-yellow-50 ring-2 ring-amber-400 dark:from-amber-900/20 dark:to-yellow-900/20 dark:ring-amber-600'
    : 'bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20';

  return (
    <div className={`mb-6 rounded-lg border p-4 shadow-sm ${containerStyles}`}>
      {/* Header */}
      <div className='mb-2 flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Досвід</h3>
        <div className='flex items-center gap-2'>
          {isHot && (
            <span className='rounded-full bg-amber-400 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-600 dark:text-amber-100'>
              🔥 Гаряча тема
            </span>
          )}
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            Рівень {userXP.level}
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <XPProgressBar userXP={userXP} />

      {/* Energy Bar */}
      {topicConfig && <EnergyBar userXP={userXP} topicConfig={topicConfig} />}

      {/* Review Timer */}
      {hasUpcomingReview && (
        <p className='text-xs text-gray-500 dark:text-gray-400'>
          До відновлення повного досвіду: {formatTimeUntilReview(new Date(userXP.nextReviewDate!))}
        </p>
      )}

      {/* Total XP */}
      <p className='text-xs text-gray-500 dark:text-gray-400'>
        Всього зароблено: {userXP.totalXpEarned} XP
      </p>
    </div>
  );
};

const TaskResultDisplay = ({ result }: TaskResultDisplayProps) => {
  const containerStyles = result.success
    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200';

  return (
    <div className={`mt-4 rounded-lg p-4 ${containerStyles}`}>
      <p className='font-medium'>{result.message}</p>
      {result.xpResult && (
        <div className='mt-2 space-y-1 text-sm'>
          {result.xpResult.multiplier !== 1 && (
            <p className='text-xs'>
              Множник XP: {Math.round(result.xpResult.multiplier * 100)}%
              {result.xpResult.isTooEarly && ' (занадто рано для повторення)'}
            </p>
          )}
          {result.xpResult.dailyTaskIndex && (
            <p className='text-xs'>
              Задача #{result.xpResult.dailyTaskIndex} сьогодні
            </p>
          )}
          {result.xpResult.nextReviewDate && (
            <p>
              Наступне повторення:{' '}
              {new Date(result.xpResult.nextReviewDate).toLocaleDateString('uk-UA')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const SuccessScreen = ({ isAuthenticated, nextReviewDate }: SuccessScreenProps) => (
  <div className='rounded-lg border bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900'>
    <div className='mb-4 text-5xl'>🎉</div>
    <h2 className='mb-2 text-2xl font-bold'>Всі завдання виконано!</h2>
    <p className='text-gray-600 dark:text-gray-400'>
      Ви успішно пройшли всі доступні вправи з цієї теми.
    </p>
    {!isAuthenticated && (
      <p className='mt-4 text-sm text-blue-600 dark:text-blue-400'>
        Авторизуйтесь, щоб зберігати свій прогрес та заробляти XP!
      </p>
    )}
    {nextReviewDate && (
      <div className='mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
        <p className='text-sm text-blue-800 dark:text-blue-200'>
          Наступне планове повторення:{' '}
          <span className='font-bold'>
            {new Date(nextReviewDate).toLocaleDateString('uk-UA')}
          </span>
        </p>
        <p className='mt-1 text-xs text-blue-600 dark:text-blue-300'>
          Повертайтеся тоді, щоб отримати максимальний досвід та закріпити знання.
        </p>
      </div>
    )}
  </div>
);

const NavigationButton = ({
  onClick,
  label,
  variant = 'secondary',
}: {
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'success';
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <button
      onClick={onClick}
      className={`mt-4 rounded-lg px-4 py-2 text-white ${variantStyles[variant]}`}
    >
      {label}
    </button>
  );
};

// ============================================================================
// Custom Hook: useTaskSubmission
// ============================================================================
const useTaskSubmission = (
  tasks: TTask[],
  topicSlug: string,
  session: ReturnType<typeof useSession>['data'],
  correctAnswerSoundRef: React.RefObject<HTMLAudioElement | null>,
) => {
  const [submissionResults, setSubmissionResults] = useState<Record<string, TaskSubmissionResponse>>({});
  const [userXP, setUserXP] = useState<UserTopicXP | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitTask = useCallback(
    async (
      taskId: string,
      answer: unknown,
      currentTaskIndex: number,
      setCurrentTaskIndex: (index: number | ((prev: number) => number)) => void,
    ) => {
      if (isSubmitting) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const isCorrect = checkTaskAnswer(task, answer);

      if (isCorrect) {
        correctAnswerSoundRef.current?.play();
      }

      // Handle unauthenticated users
      if (!session?.user) {
        const result: TaskSubmissionResponse = {
          success: isCorrect,
          message: isCorrect
            ? '✨ Правильно! Авторизуйтесь, щоб зберігати прогрес.'
            : '❌ Неправильна відповідь.',
        };
        setSubmissionResults((prev) => ({ ...prev, [taskId]: result }));

        if (IS_AUTO_TRANSITION) {
          await new Promise((resolve) => setTimeout(resolve, TASK_TRANSITION_DELAY));
          if (isCorrect) {
            setCompletedTaskIds((prev) => new Set(prev).add(taskId));
          }
          const nextIndex = findNextUnattemptedTask(
            tasks,
            currentTaskIndex,
            completedTaskIds,
            submissionResults,
            taskId,
          );
          if (nextIndex !== -1) {
            setCurrentTaskIndex(nextIndex);
          }
        }
        return;
      }

      // Handle authenticated users
      setIsSubmitting(true);

      try {
        const response = await fetch('/api/tasks/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            topicSlug,
            isCorrect,
            userAnswer: answer,
            baseXP: task.baseXP,
            difficulty: task.difficulty,
          }),
        });

        const result: TaskSubmissionResponse = await response.json();
        setSubmissionResults((prev) => ({ ...prev, [taskId]: result }));

        if (result.success && result.userXP) {
          setUserXP(result.userXP);

          if (IS_AUTO_TRANSITION) {
            await new Promise((resolve) => setTimeout(resolve, TASK_TRANSITION_DELAY));
            if (isCorrect) {
              setCompletedTaskIds((prev) => new Set(prev).add(taskId));
            }
            const nextIndex = findNextUnattemptedTask(
              tasks,
              currentTaskIndex,
              completedTaskIds,
              submissionResults,
              taskId,
            );
            if (nextIndex !== -1) {
              setCurrentTaskIndex(nextIndex);
            }
          }
        }
      } catch (error) {
        console.error('Failed to submit task:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [tasks, topicSlug, session, isSubmitting, completedTaskIds, submissionResults, correctAnswerSoundRef],
  );

  return {
    submissionResults,
    setSubmissionResults,
    userXP,
    setUserXP,
    completedTaskIds,
    setCompletedTaskIds,
    isSubmitting,
    submitTask,
  };
};

// ============================================================================
// Main Component
// ============================================================================
export const Tasks = ({
  tasks,
  topicSlug,
}: {
  tasks: (TMultipleChoiceTask | TInputTask)[];
  topicSlug: string;
}) => {
  const { data: session, status } = useSession();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [topicConfig, setTopicConfig] = useState<TopicXPConfig | null>(null);
  const [isTasksLoaded, setIsTasksLoaded] = useState(false);
  const [isTopicFinished, setIsTopicFinished] = useState(false);

  const hasInitialJumped = useRef(false);

  const correctAnswerSoundRef = useRef<HTMLAudioElement | null>(null);

  const {
    submissionResults,
    setSubmissionResults,
    userXP,
    setUserXP,
    completedTaskIds,
    setCompletedTaskIds,
    submitTask,
  } = useTaskSubmission(tasks, topicSlug, session, correctAnswerSoundRef);

  // Initialize audio
  useEffect(() => {
    correctAnswerSoundRef.current = new Audio('/sounds/correctChoice.mp3');
  }, []);

  // Fetch user XP data
  useEffect(() => {
    if (status === 'loading') return;

    const fetchUserXP = async () => {
      try {
        const response = await fetch(`/api/xp/user?topicSlug=${topicSlug}`);
        if (response.ok) {
          const data: UserXPResponse = await response.json();
          setUserXP(data.userXP);
          setTopicConfig(data.topicConfig);

          if (data.completedTaskIds) {
            const completedIds = new Set(data.completedTaskIds.map((t) => t.taskId));
            setCompletedTaskIds(completedIds);

            // Restore submission results from server data
            const restoredResults: Record<string, TaskSubmissionResponse> = {};
            data.completedTaskIds.forEach((attempt) => {
              restoredResults[attempt.taskId] = {
                success: attempt.isCorrect,
                message: attempt.isCorrect
                  ? '✨ Правильно! Прогрес збережено.'
                  : '❌ Неправильна відповідь. Спробуйте ще раз завтра!',
              };
            });
            setSubmissionResults(restoredResults);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user XP');
      } finally {
        setIsTasksLoaded(true);
      }
    };

    if (session?.user?.id) {
      fetchUserXP();
    } else {
      setIsTasksLoaded(true);
    }
  }, [session, status, topicSlug, setUserXP, setCompletedTaskIds, setSubmissionResults]);

  // Auto-select first unattempted task on load
  useEffect(() => {
    if (!isTasksLoaded || tasks.length === 0 || hasInitialJumped.current) return;

    const firstUnattemptedIndex = findNextUnattemptedTask(
      tasks,
      -1, // Start from beginning
      completedTaskIds,
      submissionResults,
    );

    if (firstUnattemptedIndex !== -1) {
      setCurrentTaskIndex(firstUnattemptedIndex);
    }
    hasInitialJumped.current = true;
  }, [isTasksLoaded, tasks, completedTaskIds, submissionResults]);

  // Check if all tasks are completed
  useEffect(() => {
    if (!isTasksLoaded || tasks.length === 0) return;

    const allTasksAttempted = tasks.every(
      (task) => completedTaskIds.has(task.id) || submissionResults[task.id],
    );

    if (allTasksAttempted) {
      setIsTopicFinished(true);
    }
  }, [isTasksLoaded, completedTaskIds.size, tasks.length, submissionResults, tasks]);

  // Handler for task submission
  const handleTaskSubmit = useCallback(
    (taskId: string, answer: unknown) => {
      submitTask(taskId, answer, currentTaskIndex, setCurrentTaskIndex);
    },
    [submitTask, currentTaskIndex],
  );

  // Handler for navigating to next task after correct answer
  const handleContinueAfterCorrect = useCallback(() => {
    const currentTask = tasks[currentTaskIndex];
    setCompletedTaskIds((prev) => new Set(prev).add(currentTask.id));

    const nextIndex = findNextUnattemptedTask(
      tasks,
      currentTaskIndex,
      completedTaskIds,
      submissionResults,
      currentTask.id,
    );

    if (nextIndex !== -1) {
      setCurrentTaskIndex(nextIndex);
    }
  }, [tasks, currentTaskIndex, completedTaskIds, submissionResults, setCompletedTaskIds]);

  // Handler for navigating to next task after incorrect answer
  const handleContinueAfterIncorrect = useCallback(() => {
    const currentTask = tasks[currentTaskIndex];
    const nextIndex = findNextUnattemptedTask(
      tasks,
      currentTaskIndex,
      completedTaskIds,
      submissionResults,
      currentTask.id,
    );

    if (nextIndex !== -1) {
      setCurrentTaskIndex(nextIndex);
    }
  }, [tasks, currentTaskIndex, completedTaskIds, submissionResults]);

  // Loading state
  if (!isTasksLoaded) {
    return <div></div>; // TODO: Add loader
  }

  const currentTask = tasks[currentTaskIndex];
  const currentResult = submissionResults[currentTask?.id];
  const hasNextTask = currentTaskIndex < tasks.length - 1;
  const hasPreviousTask = currentTaskIndex > 0;

  // Handle edge case where current task is undefined
  if (!currentTask) {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(0);
    }
    return <div>Завантаження...</div>;
  }

  // Render task component based on type
  const renderCurrentTask = () => {
    const isLocked = !!submissionResults[currentTask.id];

    switch (currentTask.type) {
      case 'multiple-choice':
        return (
          <MultipleChoiceTask
            task={currentTask}
            setAnswer={handleTaskSubmit}
            isLocked={isLocked}
          />
        );
      case 'input':
        return (
          <InputTask
            task={currentTask}
            setAnswer={handleTaskSubmit}
            isLocked={isLocked}
          />
        );
      default:
        return <div>Unknown task type</div>;
    }
  };

  return (
    <>
      <TaskNavigation
        tasks={tasks}
        currentTaskIndex={currentTaskIndex}
        submissionResults={submissionResults}
        onSelectTask={(index) => {
          setCurrentTaskIndex(index);
          setIsTopicFinished(false);
        }}
      />

      {isTopicFinished ? (
        <SuccessScreen
          isAuthenticated={!!session}
          nextReviewDate={userXP?.nextReviewDate}
        />
      ) : (
        <>
          {/* User XP Display */}
          {userXP && <UserXPDisplay userXP={userXP} topicConfig={topicConfig} />}

          {/* Current Task */}
          {renderCurrentTask()}

          {/* Task Result */}
          {currentResult && <TaskResultDisplay result={currentResult} />}

          {/* Continue Button (after correct answer) */}
          {currentResult?.success && !IS_AUTO_TRANSITION && (
            <button
              onClick={handleContinueAfterCorrect}
              className='mt-4 w-full rounded-lg bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700'
            >
              Продовжити
            </button>
          )}

          {/* Next Task Button (after incorrect answer) */}
          {currentResult && !currentResult.success && !IS_AUTO_TRANSITION && (
            <button
              onClick={handleContinueAfterIncorrect}
              className='mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700'
            >
              Наступне завдання
            </button>
          )}

          {/* Navigation Buttons */}
          {/* <div className='flex gap-2'>
            {hasPreviousTask && (
              <NavigationButton
                label='Попереднє завдання'
                onClick={() => setCurrentTaskIndex((idx) => idx - 1)}
              />
            )}
            {hasNextTask && (
              <NavigationButton
                label='Наступне завдання'
                onClick={() => setCurrentTaskIndex((idx) => idx + 1)}
              />
            )}
          </div> */}
        </>
      )}
    </>
  );
};
