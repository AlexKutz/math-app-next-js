import { TTask } from '@/types/task';
import { TaskSubmissionResponse } from '@/types/xp';

interface TaskNavigationProps {
  tasks: TTask[];
  currentTaskIndex: number;
  submissionResults: Record<string, TaskSubmissionResponse>;
  onSelectTask: (index: number) => void;
}

export const TaskNavigation = ({
  tasks,
  currentTaskIndex,
  submissionResults,
  onSelectTask,
}: TaskNavigationProps) => {
  return (
    <div className='mb-6 flex flex-wrap gap-2'>
      {tasks.map((task, index) => {
        const submission = submissionResults[task.id];
        const isCorrect = submission?.success === true;
        const isIncorrect = submission?.success === false;
        const isCurrent = index === currentTaskIndex;

        const baseStyles =
          'flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border text-sm font-bold transition-all antialiased transform-gpu';
        const statusStyles = isCorrect
          ? 'border-green-600 bg-green-500 text-white dark:border-green-500 dark:bg-green-600'
          : isIncorrect
            ? 'border-red-600 bg-red-500 text-white dark:border-red-500 dark:bg-red-600'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400 dark:hover:bg-gray-700/60';
        const currentStyles = isCurrent
          ? 'scale-110 ring-2 ring-blue-500 ring-offset-2 dark:ring-blue-400 dark:ring-offset-black'
          : 'hover:scale-105';

        return (
          <button
            key={task.id}
            onClick={() => onSelectTask(index)}
            className={`${baseStyles} ${statusStyles} ${currentStyles}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
};
