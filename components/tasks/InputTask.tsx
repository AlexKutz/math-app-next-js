'use client';

import { TInputTask } from '@/types/task';
import { useState } from 'react';

interface InputTaskProps {
  task: TInputTask;
  setAnswer?: (taskId: string, answer: string) => void;
}

export function InputTask({ task, setAnswer }: InputTaskProps) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

  const acceptedList: string[] =
    // task.accepted might be typed narrowly in your types file; guard at runtime
    Array.isArray((task as any).accepted)
      ? (task as any).accepted
      : [(task as any).accepted];

  const handleSubmit = () => {
    if (submitted) return;

    const answer = value.trim();
    const ok =
      acceptedList.some((a) => normalize(a) === normalize(answer)) ||
      normalize(answer) === normalize((task as any).correct);
    setSubmitted(true);
    setIsCorrect(ok);
    setAnswer?.(task.id, answer);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className='rounded-xl border bg-white p-4 shadow-sm'>
      <p className='mb-3 font-medium'>{task.question}</p>

      <div className='flex flex-col gap-2'>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={task.placeholder}
          disabled={submitted}
          className={`w-full rounded-lg border p-3 transition focus:outline-none ${
            submitted && isCorrect ? 'border-green-600 bg-green-50' : ''
          } ${submitted && isCorrect === false ? 'border-red-600 bg-red-50' : ''}`}
        />

        <div className='flex gap-2'>
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50'
          >
            Submit
          </button>
          <button
            onClick={() => setValue('')}
            disabled={submitted}
            className='rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-50'
          >
            Clear
          </button>
        </div>

        {submitted && isCorrect && (
          <div className='mt-2 rounded-md bg-green-50 p-3 text-sm text-green-700'>
            ✅ Correct
          </div>
        )}

        {submitted && isCorrect === false && (
          <div className='mt-2 space-y-2'>
            <div className='rounded-md bg-red-50 p-3 text-sm text-red-700'>
              ❌ Incorrect
            </div>
            <div className='text-sm text-gray-700'>
              Accepted answers:{' '}
              {(acceptedList.length
                ? acceptedList
                : [(task as any).correct]
              ).join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
