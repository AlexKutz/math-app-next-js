'use client';

import { TInputTask } from '@/types/task';
import { useEffect, useState } from 'react';
import { TaskCard } from './TaskCard';

interface InputTaskProps {
  task: TInputTask;
  setAnswer?: (taskId: string, answer: string) => void;
  initialAnswer?: string;
  isLocked?: boolean;
}

export function InputTask({
  task,
  setAnswer,
  initialAnswer = '',
  isLocked = false,
}: InputTaskProps) {
  const [value, setValue] = useState(initialAnswer);
  const [submitted, setSubmitted] = useState(isLocked);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

  const acceptedList: string[] =
    // task.accepted might be typed narrowly in your types file; guard at runtime
    Array.isArray((task as any).accepted)
      ? (task as any).accepted
      : [(task as any).accepted];

  useEffect(() => {
    if (isLocked || initialAnswer) {
      const ok =
        acceptedList.some((a) => normalize(a) === normalize(initialAnswer)) ||
        normalize(initialAnswer) === normalize((task as any).correct);
      setIsCorrect(ok);
      setSubmitted(true);
      setValue(initialAnswer);
    } else {
      setIsCorrect(null);
      setSubmitted(false);
      setValue('');
    }
  }, [task, initialAnswer, isLocked]);

  const handleSubmit = () => {
    if (submitted || isLocked) return;

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
    <TaskCard question={task.question}>
      <div className='flex flex-col gap-2'>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={task.placeholder}
          disabled={submitted || isLocked}
          className={`w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition placeholder:text-gray-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 ${
            submitted && isCorrect
              ? 'border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/30'
              : ''
          } ${submitted && isCorrect === false ? 'border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-900/30' : ''}`}
        />

        <div className='flex gap-2'>
          <button
            onClick={handleSubmit}
            disabled={submitted || isLocked}
            className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600'
          >
            Submit
          </button>
          <button
            onClick={() => setValue('')}
            disabled={submitted || isLocked}
            className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            Clear
          </button>
        </div>

        {submitted && isCorrect && (
          <div className='mt-2 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400'>
            ✅ Correct
          </div>
        )}

        {submitted && isCorrect === false && (
          <div className='mt-2 space-y-2'>
            <div className='rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400'>
              ❌ Incorrect
            </div>
            <div className='text-sm text-gray-700 dark:text-gray-300'>
              Accepted answers:{' '}
              {(acceptedList.length
                ? acceptedList
                : [(task as any).correct]
              ).join(', ')}
            </div>
          </div>
        )}
      </div>
    </TaskCard>
  );
}
