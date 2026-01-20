'use client';

import { TMultipleChoiceTask } from '@/types/task';
import { useEffect, useState } from 'react';

interface MultipleChoiceTaskProps {
  task: TMultipleChoiceTask;
  setAnswer?: (taskId: string, answer: number) => void;
}

export function MultipleChoiceTask({
  task,
  setAnswer,
}: MultipleChoiceTaskProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (selected !== null) return;

    setSelected(index);
    setAnswer?.(task.id, index);
  };

  useEffect(() => {
    setSelected(null);
  }, [task]);


  return (
    <div className='rounded-xl border bg-white p-4 shadow-sm'>
      <p className='mb-3 font-medium'>{task.question}</p>

      <div className='flex flex-col gap-2'>
        {task.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = selected !== null && i === task.answer;
          const isWrong = isSelected && i !== task.answer;

          return (
            <div key={i}>
              <button
                onClick={() => handleSelect(i)}
                className={`w-full rounded-lg border p-3 text-left transition ${isCorrect ? 'border-green-600 bg-green-100' : ''} ${isWrong ? 'border-red-600 bg-red-100' : ''} `}
              >
                {opt.text}
              </button>

              {isWrong && opt.comment && (
                <div className='mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700'>
                  💡 {opt.comment}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
