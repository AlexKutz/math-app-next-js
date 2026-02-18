'use client';

import Link from 'next/link';
import { TopicProgress } from '@/types/dashboard';
import {
  formatXP,
  formatRelativeTime,
  formatTimeUntilReview,
} from '@/lib/dashboard/progressUtils';
import { ProgressBar } from './ProgressBar';
import { MasteryBadge, HotTopicBadge, DifficultyBadge } from './StatusBadge';

interface TopicProgressRowProps {
  topic: TopicProgress;
  showSubject?: boolean;
}

export function TopicProgressRow({ topic, showSubject = false }: TopicProgressRowProps) {
  const getActionButton = () => {
    if (topic.isCompleted) {
      return (
        <Link
          href={topic.exercisesHref}
          className='inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30'
        >
          <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            />
          </svg>
          Повторити
        </Link>
      );
    }

    if (topic.level > 0 || topic.totalXpEarned > 0) {
      return (
        <Link
          href={topic.exercisesHref}
          className='inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30'
        >
          <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 10V3L4 14h7v7l9-11h-7z'
            />
          </svg>
          Продовжити
        </Link>
      );
    }

    return (
      <Link
        href={topic.lessonHref}
        className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      >
        <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
          />
        </svg>
        Почати
      </Link>
    );
  };

  return (
    <div className='p-4 transition-colors hover:bg-muted/50'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        {/* Left: Topic Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <h4 className='font-medium text-foreground truncate'>{topic.title}</h4>
            {topic.isHotTopic && !topic.isCompleted && <HotTopicBadge />}
            <MasteryBadge status={topic.masteryStatus} />
            {topic.difficulty && <DifficultyBadge difficulty={topic.difficulty} />}
          </div>

          <div className='mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
            <span>{topic.sectionTitle}</span>
            {showSubject && (
              <span className='capitalize'>
                {topic.subject === 'math' && 'Математика'}
                {topic.subject === 'algebra' && 'Алгебра'}
                {topic.subject === 'geometry' && 'Геометрія'}
                {topic.subject === 'physics' && 'Фізика'}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className='mt-2'>
            <ProgressBar
              percent={topic.progressPercent}
              size='sm'
              color={topic.isCompleted ? 'success' : 'gradient'}
              showPercentage={false}
            />
          </div>

          {/* Stats Row */}
          <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
            <span>
              Рівень: <span className='font-medium text-foreground'>{topic.level}</span>
            </span>
            <span>
              Досвід:{' '}
              <span className='font-medium text-foreground'>
                {formatXP(topic.currentXp)}
                {topic.nextLevelXp && ` / ${formatXP(topic.nextLevelXp)}`}
              </span>
            </span>
            {topic.lastActivity && (
              <span>
                Активність:{' '}
                <span className='font-medium text-foreground'>
                  {formatRelativeTime(topic.lastActivity)}
                </span>
              </span>
            )}
            {topic.nextReviewDate && !topic.isCompleted && (
              <span>
                Повторення:{' '}
                <span
                  className={`font-medium ${
                    topic.isHotTopic ? 'text-amber-600 dark:text-amber-400' : ''
                  }`}
                >
                  {formatTimeUntilReview(topic.nextReviewDate)}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Action Button */}
        <div className='flex-shrink-0'>{getActionButton()}</div>
      </div>
    </div>
  );
}
