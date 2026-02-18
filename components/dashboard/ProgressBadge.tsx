'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

type ProgressBadgeProps = {
  sectionTitle: string;
  totalLessons: number;
};

export function ProgressBadge({
  sectionTitle,
  totalLessons,
}: ProgressBadgeProps) {
  const [completed, setCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const session = useSession();

  useEffect(() => {
    // TODO: Fetch user progress for this section from API/database
    // Example: fetchSectionProgress(sectionTitle).then(setCompleted)
    setIsLoading(false);
  }, [sectionTitle]);

  const percentage = totalLessons > 0 ? (completed / totalLessons) * 100 : 0;
  const isComplete = completed === totalLessons && totalLessons > 0;

  if (isLoading) {
    return (
      <div className='h-7 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700' />
    );
  }

  if (!session.data) return null;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
        isComplete
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400'
      }`}
      role='status'
      aria-label={`Прогрес: ${completed} з ${totalLessons} завершено`}
    >
      <span className='font-semibold'>{completed}</span>
      <span className='text-xs'>/</span>
      <span>{totalLessons}</span>
    </div>
  );
}
