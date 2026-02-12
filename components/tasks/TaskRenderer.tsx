'use client';

import { TMultipleChoiceTask, TInputTask, TCoordinatePlaneTask, TTask } from '@/types/task';
import { lazy, Suspense } from 'react';
import { TaskSubmissionResponse } from '@/types/xp';

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

interface TaskRendererProps {
  task: TTask;
  submissionResults: Record<string, TaskSubmissionResponse>;
  onSubmit: (taskId: string, answer: unknown) => void;
}

/**
 * Renders the appropriate task component based on task type
 * Handles lazy loading and answer deserialization
 */
export function TaskRenderer({ task, submissionResults, onSubmit }: TaskRendererProps) {
  const submission = submissionResults[task.id];
  const isLocked = !!submission;
  const initialAnswer = submission?.userAnswer;

  switch (task.type) {
    case 'multiple-choice':
      return (
        <Suspense fallback={<TaskLoadingFallback />}>
          <MultipleChoiceTask
            task={task as TMultipleChoiceTask}
            setAnswer={onSubmit}
            isLocked={isLocked}
            initialAnswer={initialAnswer !== undefined ? Number(initialAnswer) : null}
          />
        </Suspense>
      );
    case 'input':
      return (
        <Suspense fallback={<TaskLoadingFallback />}>
          <InputTask
            task={task as TInputTask}
            setAnswer={onSubmit}
            isLocked={isLocked}
            initialAnswer={initialAnswer !== undefined ? String(initialAnswer) : ''}
          />
        </Suspense>
      );
    case 'coordinate-plane':
      return (
        <Suspense fallback={<TaskLoadingFallback />}>
          <CoordinatePlaneTask
            task={task as TCoordinatePlaneTask}
            setAnswer={onSubmit}
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
}
