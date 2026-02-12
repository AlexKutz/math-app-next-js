'use client';

import { TMultipleChoiceTask, TInputTask, TCoordinatePlaneTask } from '@/types/task';
import { useSession } from 'next-auth/react';
import { useTaskSubmission } from './hooks/useTaskSubmission';
import { useUserXP } from './hooks/useUserXP';
import { useAudio } from './hooks/useAudio';
import { useTaskNavigation } from './hooks/useTaskNavigation';
import { TaskNavigation } from './TaskNavigation';
import { UserXPDisplay } from './UserXPDisplay';
import { TaskResultDisplay } from './TaskResultDisplay';
import { SuccessScreen } from './SuccessScreen';
import { TaskRenderer } from './TaskRenderer';
import { TaskActionButtons } from './TaskActionButtons';
import { TransitionProgressBar } from './TransitionProgressBar';
import { EmptyTasksState } from './EmptyTasksState';
import { TasksLoadingState } from './TasksLoadingState';
import { IS_AUTO_TRANSITION } from './utils';

interface TasksProps {
  tasks: (TMultipleChoiceTask | TInputTask | TCoordinatePlaneTask)[];
  topicSlug: string;
}

/**
 * Main Tasks component - orchestrates the task execution flow
 * 
 * Responsibilities:
 * - Coordinates hooks for state management
 * - Handles task navigation and submission flow
 * - Renders layout with sub-components
 * 
 * Delegated to sub-components:
 * - TaskRenderer: Renders specific task types with lazy loading
 * - TaskActionButtons: Renders continue/next buttons
 * - TransitionProgressBar: Shows auto-transition animation
 * - EmptyTasksState: Shows when no tasks available
 * - TasksLoadingState: Shows during XP data loading
 */
export function Tasks({ tasks, topicSlug }: TasksProps) {
  const { data: session } = useSession();
  
  // Custom hooks for separated concerns
  const { 
    userXP, 
    topicConfig, 
    isXPLoaded,
    completedTaskIds,
    setCompletedTaskIds
  } = useUserXP({ topicSlug });
  
  const { correctAnswerSoundRef, playCorrectAnswerSound } = useAudio();

  const {
    submissionResults,
    submitTask,
  } = useTaskSubmission(tasks, topicSlug, session, correctAnswerSoundRef, playCorrectAnswerSound);

  const {
    currentTaskIndex,
    setCurrentTaskIndex,
    isTopicFinished,
    navigateToNextTask,
    resetTopicCompletion
  } = useTaskNavigation({ tasks, completedTaskIds, submissionResults });

  // Event handlers
  const handleTaskSubmit = (taskId: string, answer: unknown) => {
    submitTask(taskId, answer, currentTaskIndex, setCurrentTaskIndex);
  };

  const handleContinueAfterCorrect = () => {
    const currentTask = tasks[currentTaskIndex];
    setCompletedTaskIds((prev) => new Set(prev).add(currentTask.id));
    navigateToNextTask(currentTask.id);
  };

  const handleContinueAfterIncorrect = () => {
    const currentTask = tasks[currentTaskIndex];
    navigateToNextTask(currentTask.id);
  };

  const handleSelectTask = (index: number) => {
    setCurrentTaskIndex(index);
    resetTopicCompletion();
  };

  // Loading state
  if (!isXPLoaded) {
    return <TasksLoadingState />;
  }

  // Empty state
  if (tasks.length === 0) {
    return <EmptyTasksState />;
  }

  const currentTask = tasks[currentTaskIndex];
  const currentResult = submissionResults[currentTask?.id];

  // Edge case: invalid task index
  if (!currentTask) {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(0);
    }
    return <div>Завантаження...</div>;
  }

  return (
    <>
      <TaskNavigation
        tasks={tasks}
        currentTaskIndex={currentTaskIndex}
        submissionResults={submissionResults}
        onSelectTask={handleSelectTask}
      />

      {isTopicFinished ? (
        <SuccessScreen
          isAuthenticated={!!session}
          nextReviewDate={userXP?.nextReviewDate}
        />
      ) : (
        <>
          {userXP && (
            <UserXPDisplay userXP={userXP} topicConfig={topicConfig} />
          )}

          <TaskRenderer
            task={currentTask}
            submissionResults={submissionResults}
            onSubmit={handleTaskSubmit}
          />

          {currentResult && <TaskResultDisplay result={currentResult} />}

          <TransitionProgressBar 
            show={!!currentResult && IS_AUTO_TRANSITION && !completedTaskIds.has(currentTask.id)} 
          />

          {currentResult && (
            <TaskActionButtons
              currentResult={currentResult}
              onContinueCorrect={handleContinueAfterCorrect}
              onContinueIncorrect={handleContinueAfterIncorrect}
            />
          )}
        </>
      )}
    </>
  );
}
