import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { TTask } from '@/types/task';
import { TaskSubmissionResponse, UserTopicXP } from '@/types/xp';
import {
  checkTaskAnswer,
  IS_AUTO_TRANSITION,
  TASK_TRANSITION_DELAY,
  findNextUnattemptedTask,
} from '../utils';

export const useTaskSubmission = (
  tasks: TTask[],
  topicSlug: string,
  session: ReturnType<typeof useSession>['data'],
  correctAnswerSoundRef: React.RefObject<HTMLAudioElement | null>,
) => {
  const [submissionResults, setSubmissionResults] = useState<
    Record<string, TaskSubmissionResponse>
  >({});
  const [userXP, setUserXP] = useState<UserTopicXP | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(
    new Set(),
  );
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
        setSubmissionResults((prev) => ({
          ...prev,
          [taskId]: { ...result, userAnswer: answer },
        }));

        if (IS_AUTO_TRANSITION) {
          await new Promise((resolve) =>
            setTimeout(resolve, TASK_TRANSITION_DELAY),
          );

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
        setSubmissionResults((prev) => ({
          ...prev,
          [taskId]: { ...result, userAnswer: answer },
        }));

        if (result.success && result.userXP) {
          setUserXP(result.userXP);

          if (IS_AUTO_TRANSITION) {
            await new Promise((resolve) =>
              setTimeout(resolve, TASK_TRANSITION_DELAY),
            );

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
    [
      tasks,
      topicSlug,
      session,
      isSubmitting,
      completedTaskIds,
      submissionResults,
      correctAnswerSoundRef,
    ],
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
