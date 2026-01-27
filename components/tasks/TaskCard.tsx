import { ReactNode } from 'react';

interface TaskCardProps {
  question: string;
  children: ReactNode;
}

export function TaskCard({ question, children }: TaskCardProps) {
  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
      <p className='mb-3 font-medium text-gray-800 dark:text-gray-100'>
        {question}
      </p>
      {children}
    </div>
  );
}
