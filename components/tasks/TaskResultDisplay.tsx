import { TaskSubmissionResponse } from '@/types/xp';

interface TaskResultDisplayProps {
  result: TaskSubmissionResponse;
}

export const TaskResultDisplay = ({ result }: TaskResultDisplayProps) => {
  const containerStyles = result.success
    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200';

  return (
    <div className={`mt-4 rounded-lg p-4 ${containerStyles}`}>
      <p className='font-medium'>{result.message}</p>
      {result.xpResult && (
        <div className='mt-2 space-y-1 text-sm'>
          {result.xpResult.multiplier !== 1 && (
            <p className='text-xs'>
              Множник XP: {Math.round(result.xpResult.multiplier * 100)}%
              {result.xpResult.isTooEarly && ' (занадто рано для повторення)'}
            </p>
          )}
          {result.xpResult.dailyTaskIndex && (
            <p className='text-xs'>
              Задача #{result.xpResult.dailyTaskIndex} сьогодні
            </p>
          )}
          {result.xpResult.nextReviewDate && (
            <p>
              Наступне повторення:{' '}
              {new Date(result.xpResult.nextReviewDate).toLocaleDateString(
                'uk-UA',
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
