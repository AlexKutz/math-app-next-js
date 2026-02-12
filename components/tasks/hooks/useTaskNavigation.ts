import { useState, useEffect, useRef, useCallback } from 'react';
import { TTask } from '@/types/task';
import { TaskSubmissionResponse } from '@/types/xp';
import { findNextUnattemptedTask } from '../utils';

interface UseTaskNavigationProps {
  tasks: TTask[];
  completedTaskIds: Set<string>;
  submissionResults: Record<string, TaskSubmissionResponse>;
}

/**
 * Custom hook for managing task navigation logic
 * Handles automatic task progression and topic completion detection
 */
export const useTaskNavigation = ({
  tasks,
  completedTaskIds,
  submissionResults,
}: UseTaskNavigationProps) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isTopicFinished, setIsTopicFinished] = useState(false);
  const hasInitialJumped = useRef(false);

  /**
   * Automatically selects the first unattempted task on component load
   */
  useEffect(() => {
    if (tasks.length === 0 || hasInitialJumped.current) return;

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
  }, [tasks, completedTaskIds, submissionResults]);

  /**
   * Checks if all tasks in the topic have been completed
   */
  useEffect(() => {
    if (tasks.length === 0) return;

    const allTasksAttempted = tasks.every(
      (task) => completedTaskIds.has(task.id) || submissionResults[task.id],
    );

    if (allTasksAttempted) {
      setIsTopicFinished(true);
    }
  }, [completedTaskIds.size, tasks, submissionResults]);

  /**
   * Navigates to the next unattempted task after a correct answer
   */
  const navigateToNextTask = useCallback(
    (currentTaskId: string) => {
      const nextIndex = findNextUnattemptedTask(
        tasks,
        currentTaskIndex,
        completedTaskIds,
        submissionResults,
        currentTaskId,
      );

      if (nextIndex !== -1) {
        setCurrentTaskIndex(nextIndex);
        setIsTopicFinished(false);
      }
    },
    [tasks, currentTaskIndex, completedTaskIds, submissionResults],
  );

  /**
   * Resets the topic completion state
   */
  const resetTopicCompletion = useCallback(() => {
    setIsTopicFinished(false);
  }, []);

  return {
    currentTaskIndex,
    setCurrentTaskIndex,
    isTopicFinished,
    setIsTopicFinished,
    navigateToNextTask,
    resetTopicCompletion,
  };
};