'use client';

import { TMultipleChoiceTask } from '@/types/task';
import { useEffect, useState } from 'react';
import { TaskCard } from './TaskCard';

interface MultipleChoiceTaskProps {
  task: TMultipleChoiceTask;
  setAnswer?: (taskId: string, answer: number) => void;
  initialAnswer?: number | null;
  isLocked?: boolean;
}

export function MultipleChoiceTask({
  task,
  setAnswer,
  initialAnswer = null,
  isLocked = false,
}: MultipleChoiceTaskProps) {
  const [selected, setSelected] = useState<number | null>(initialAnswer);

  const handleSelect = (index: number) => {
    if (selected !== null || isLocked) return;

    setSelected(index);
    setAnswer?.(task.id, index);
  };

  useEffect(() => {
    setSelected(initialAnswer);
  }, [task, initialAnswer]);

  return (
    <TaskCard question={task.question}>
      <div className='flex flex-col gap-3'>
        {task.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = selected !== null && i === task.answer;
          const isWrong = isSelected && i !== task.answer;

          return (
            <div key={i}>
              <button
                onClick={() => handleSelect(i)}
                disabled={selected !== null || isLocked}
                className={`w-full rounded-lg border-2 p-4 text-left font-medium transition-all duration-200 ${!isSelected && selected === null ? 'border-gray-300 bg-gray-50 text-gray-900 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:border-blue-500 dark:hover:bg-blue-900/30' : ''} ${isCorrect ? 'border-green-500 bg-green-50 text-green-800 shadow-md dark:border-green-600 dark:bg-green-900/30 dark:text-green-400' : ''} ${isWrong ? 'border-red-500 bg-red-50 text-red-800 shadow-md dark:border-red-600 dark:bg-red-900/30 dark:text-red-400' : ''} ${selected !== null && !isSelected && !isCorrect ? 'border-gray-200 bg-gray-100 text-gray-600 opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400' : ''} ${selected !== null || isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              >
                <div className='flex items-center gap-2'>
                  {isCorrect && (
                    <span className='text-green-600 dark:text-green-400'>
                      ✓
                    </span>
                  )}
                  {isWrong && (
                    <span className='text-red-600 dark:text-red-400'>✗</span>
                  )}
                  <span>{opt.text}</span>
                </div>
              </button>

              {isWrong && opt.comment && (
                <div className='mt-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'>
                  <span className='mr-2 text-base'>💡</span>
                  <span className='font-medium'>{opt.comment}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TaskCard>
  );
}
