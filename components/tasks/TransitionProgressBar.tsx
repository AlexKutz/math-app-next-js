'use client';

import { TASK_TRANSITION_DELAY } from './utils';

interface TransitionProgressBarProps {
  show: boolean;
}

/**
 * Animated progress bar shown during auto-transition between tasks
 */
export function TransitionProgressBar({ show }: TransitionProgressBarProps) {
  if (!show) return null;

  return (
    <>
      <div className='mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
        <div
          className='h-full w-0 bg-blue-600 dark:bg-blue-500'
          style={{
            animation: `fillProgress ${TASK_TRANSITION_DELAY}ms linear forwards`,
          }}
        />
      </div>

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
    </>
  );
}
