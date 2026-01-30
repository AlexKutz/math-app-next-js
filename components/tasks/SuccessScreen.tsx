import { DateLike } from './utils';

interface SuccessScreenProps {
  isAuthenticated: boolean;
  nextReviewDate?: DateLike;
}

export const SuccessScreen = ({
  isAuthenticated,
  nextReviewDate,
}: SuccessScreenProps) => (
  <div className='rounded-lg border border-gray-200 bg-white p-8 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900'>
    <div className='mb-4 text-5xl'>🎉</div>
    <h2 className='mb-2 text-2xl font-bold'>Всі завдання виконано!</h2>
    <p className='text-gray-600 dark:text-gray-400'>
      Ви успішно пройшли всі доступні вправи з цієї теми.
    </p>
    {!isAuthenticated && (
      <p className='mt-4 text-sm text-blue-600 dark:text-blue-400'>
        Авторизуйтесь, щоб зберігати свій прогрес та заробляти XP!
      </p>
    )}
    {nextReviewDate && (
      <div className='mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
        <p className='text-sm text-blue-800 dark:text-blue-200'>
          Наступне повторення:{' '}
          <span className='font-bold'>
            {new Date(nextReviewDate).toLocaleDateString('uk-UA')}
          </span>
        </p>
        <p className='mt-1 text-xs text-blue-600 dark:text-blue-300'>
          Повертайтеся тоді, щоб отримати максимальний досвід та закріпити
          знання.
        </p>
      </div>
    )}
  </div>
);
