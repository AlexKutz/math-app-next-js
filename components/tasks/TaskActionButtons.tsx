'use client';

import { TaskSubmissionResponse } from '@/types/xp';
import { IS_AUTO_TRANSITION } from './utils';

interface TaskActionButtonsProps {
  currentResult: TaskSubmissionResponse;
  onContinueCorrect: () => void;
  onContinueIncorrect: () => void;
}

/**
 * Renders action buttons after task submission
 * Shows different buttons based on correctness and auto-transition setting
 */
export function TaskActionButtons({
  currentResult,
  onContinueCorrect,
  onContinueIncorrect,
}: TaskActionButtonsProps) {
  return (
    <>
      {/* Continue Button (after correct answer) */}
      {currentResult.success && !IS_AUTO_TRANSITION && (
        <button
          onClick={onContinueCorrect}
          className='mt-4 w-full rounded-lg bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700'
        >
          Продовжити
        </button>
      )}

      {/* Next Task Button (after incorrect answer) */}
      {!currentResult.success && !IS_AUTO_TRANSITION && (
        <button
          onClick={onContinueIncorrect}
          className='mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700'
        >
          Наступне завдання
        </button>
      )}
    </>
  );
}
