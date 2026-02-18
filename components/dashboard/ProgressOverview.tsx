'use client';

import { ProgressOverview as ProgressOverviewType } from '@/types/dashboard';
import { formatXP } from '@/lib/dashboard/progressUtils';
import { ProgressBar } from './ProgressBar';

interface ProgressOverviewProps {
  overview: ProgressOverviewType;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div
      className={`rounded-xl border p-6 transition-shadow hover:shadow-md ${colorClasses[color]}`}
    >
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <p className='mt-2 text-3xl font-bold text-foreground'>{value}</p>
          {subtitle && <p className='mt-1 text-sm text-muted-foreground'>{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-3 ${iconColorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

export function ProgressOverview({ overview }: ProgressOverviewProps) {
  const completionPercent =
    overview.totalTopics > 0
      ? Math.round((overview.topicsCompleted / overview.totalTopics) * 100)
      : 0;

  return (
    <div className='space-y-6'>
      {/* Stats Grid */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Загальний досвід'
          value={formatXP(overview.totalXpEarned)}
          subtitle='XP зароблено'
          color='purple'
          icon={
            <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 10V3L4 14h7v7l9-11h-7z'
              />
            </svg>
          }
        />

        <StatCard
          title='Завершено тем'
          value={`${overview.topicsCompleted} / ${overview.totalTopics}`}
          subtitle={`${completionPercent}% завершено`}
          color='green'
          icon={
            <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          }
        />

        <StatCard
          title='Поточна серія'
          value={overview.currentStreak}
          subtitle={overview.currentStreak === 1 ? 'день поспіль' : 'днів поспіль'}
          color='amber'
          icon={
            <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z'
              />
            </svg>
          }
        />

        <StatCard
          title='Теми для повторення'
          value={overview.hotTopicsCount}
          subtitle='Потребують уваги'
          color='red'
          icon={
            <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          }
        />
      </div>

      {/* Progress Summary */}
      <div className='rounded-xl border bg-card p-6'>
        <h3 className='text-lg font-semibold'>Загальний прогрес</h3>
        <div className='mt-4 space-y-4'>
          <ProgressBar
            percent={completionPercent}
            label='Завершення тем'
            size='lg'
            color='gradient'
          />

          <div className='grid gap-4 pt-2 sm:grid-cols-3'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
                {overview.topicsCompleted}
              </p>
              <p className='text-sm text-muted-foreground'>Завершено</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                {overview.topicsInProgress}
              </p>
              <p className='text-sm text-muted-foreground'>В процесі</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-600 dark:text-gray-400'>
                {overview.totalTopics - overview.topicsCompleted - overview.topicsInProgress}
              </p>
              <p className='text-sm text-muted-foreground'>Не розпочато</p>
            </div>
          </div>
        </div>

        {overview.lastActivityDate && (
          <div className='mt-4 border-t pt-4'>
            <p className='text-sm text-muted-foreground'>
              Остання активність:{' '}
              <span className='font-medium text-foreground'>
                {new Date(overview.lastActivityDate).toLocaleDateString('uk-UA', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
