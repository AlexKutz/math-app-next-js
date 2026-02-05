'use client';

import { TMultipleChoiceTask, TInputTask, TCoordinatePlaneTask } from '@/types/task';
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { TaskSubmissionResponse, TopicXPConfig } from '@/types/xp';
import { GETXpUserResponse as UserXPResponse } from '@/types/xp';
import { useTaskSubmission } from './hooks/useTaskSubmission';
import { TaskNavigation } from './TaskNavigation';
import { UserXPDisplay } from './UserXPDisplay';
import { TaskResultDisplay } from './TaskResultDisplay';
import { SuccessScreen } from './SuccessScreen';
import {
  findNextUnattemptedTask,
  IS_AUTO_TRANSITION,
  TASK_TRANSITION_DELAY,
} from './utils';

// Lazy load task components for code splitting
const MultipleChoiceTask = lazy(() =>
  import('./MultipleChoiceTask').then((module) => ({
    default: module.MultipleChoiceTask,
  }))
);

const InputTask = lazy(() =>
  import('./InputTask').then((module) => ({
    default: module.InputTask,
  }))
);

const CoordinatePlaneTask = lazy(() =>
  import('./CoordinatePlaneTask').then((module) => ({
    default: module.CoordinatePlaneTask,
  }))
);

// Task loading fallback component
const TaskLoadingFallback = () => (
  <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Завантаження завдання...</p>
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================
export const Tasks = ({
  tasks,
  topicSlug,
}: {
  tasks: (TMultipleChoiceTask | TInputTask | TCoordinatePlaneTask)[];
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
            const completedIds = new Set(
              data.completedTaskIds.map((t) => t.taskId),
            );
            setCompletedTaskIds(completedIds);

            // Restore submission results from server data
            const restoredResults: Record<string, TaskSubmissionResponse> = {};
            data.completedTaskIds.forEach((attempt) => {
              restoredResults[attempt.taskId] = {
                success: attempt.isCorrect,
                userAnswer: attempt.userAnswer,
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
  }, [
    session,
    status,
    topicSlug,
    setUserXP,
    setCompletedTaskIds,
    setSubmissionResults,
  ]);

  // Auto-select first unattempted task on load
  useEffect(() => {
    if (!isTasksLoaded || tasks.length === 0 || hasInitialJumped.current)
      return;

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
  }, [
    isTasksLoaded,
    completedTaskIds.size,
    tasks.length,
    submissionResults,
    tasks,
  ]);

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
  }, [
    tasks,
    currentTaskIndex,
    completedTaskIds,
    submissionResults,
    setCompletedTaskIds,
  ]);

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

  // Handle case when there are no tasks
  if (tasks.length === 0) {
    return (
      <div className='rounded-lg border border-gray-300 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800'>
        <p className='text-gray-700 dark:text-gray-300'>
          Для цієї теми поки немає вправ.
        </p>
      </div>
    );
  }

  const currentTask = tasks[currentTaskIndex];
  const currentResult = submissionResults[currentTask?.id];

  // Handle edge case where current task is undefined
  if (!currentTask) {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(0);
    }
    return <div>Завантаження...</div>;
  }

  // Render task component based on type
  const renderCurrentTask = () => {
    const submission = submissionResults[currentTask.id];
    const isLocked = !!submission;
    const initialAnswer = submission?.userAnswer;

    switch (currentTask.type) {
      case 'multiple-choice':
        return (
          <Suspense fallback={<TaskLoadingFallback />}>
            <MultipleChoiceTask
              task={currentTask}
              setAnswer={handleTaskSubmit}
              isLocked={isLocked}
              initialAnswer={initialAnswer !== undefined ? Number(initialAnswer) : null}
            />
          </Suspense>
        );
      case 'input':
        return (
          <Suspense fallback={<TaskLoadingFallback />}>
            <InputTask
              task={currentTask}
              setAnswer={handleTaskSubmit}
              isLocked={isLocked}
              initialAnswer={initialAnswer !== undefined ? String(initialAnswer) : ''}
            />
          </Suspense>
        );
      case 'coordinate-plane':
        return (
          <Suspense fallback={<TaskLoadingFallback />}>
            <CoordinatePlaneTask
              task={currentTask}
              setAnswer={handleTaskSubmit}
              isLocked={isLocked}
              initialAnswer={
                initialAnswer !== undefined ? JSON.parse(initialAnswer as string) : []
              }
            />
          </Suspense>
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
          {userXP && (
            <UserXPDisplay userXP={userXP} topicConfig={topicConfig} />
          )}

          {/* Current Task */}
          {renderCurrentTask()}

          {/* Task Result */}
          {currentResult && <TaskResultDisplay result={currentResult} />}

          {/* Transition Progress Bar */}
          {currentResult &&
            IS_AUTO_TRANSITION &&
            !completedTaskIds.has(currentTask.id) && (
              <div className='mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
                <div
                  className='h-full w-0 bg-blue-600 dark:bg-blue-500'
                  style={{
                    animation: `fillProgress ${TASK_TRANSITION_DELAY}ms linear forwards`,
                  }}
                />
              </div>
            )}

          <style jsx>{`
            @keyframes fillProgress {
              from {
                width: 0%;
              }
              to {
                width: 100%;
              }
            }
          `}</style>

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
        </>
      )}
    </>
  );
};
