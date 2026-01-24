'use client';

import { TMultipleChoiceTask } from '@/types/task';
import { useEffect, useState } from 'react';

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
    <div className='rounded-xl bg-white p-6 shadow-xl border border-gray-200'>
      <p className='mb-4 text-lg font-semibold text-gray-800'>{task.question}</p>

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
                className={`w-full rounded-lg border-2 p-4 text-left transition-all duration-200 font-medium
                  ${!isSelected && selected === null ? 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md' : ''}
                  ${isCorrect ? 'border-green-500 bg-green-50 text-green-800 shadow-md' : ''} 
                  ${isWrong ? 'border-red-500 bg-red-50 text-red-800 shadow-md' : ''}
                  ${selected !== null && !isSelected && !isCorrect ? 'border-gray-200 bg-gray-100 opacity-60' : ''}
                  ${selected !== null || isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className='flex items-center gap-2'>
                  {isCorrect && <span className='text-green-600'>✓</span>}
                  {isWrong && <span className='text-red-600'>✗</span>}
                  <span>{opt.text}</span>
                </div>
              </button>

              {isWrong && opt.comment && (
                <div className='mt-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 shadow-sm'>
                  <span className='mr-2 text-base'>💡</span>
                  <span className='font-medium'>{opt.comment}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
