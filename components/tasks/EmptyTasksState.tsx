'use client';

/**
 * Displayed when a topic has no tasks available
 */
export function EmptyTasksState() {
  return (
    <div className='rounded-lg border border-gray-300 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800'>
      <p className='text-gray-700 dark:text-gray-300'>
        Для цієї теми поки немає вправ.
      </p>
    </div>
  );
}
