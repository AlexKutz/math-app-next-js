'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SubjectProgress } from '@/types/dashboard';
import { calculateSubjectCompletionPercentage, formatXP } from '@/lib/dashboard/progressUtils';
import { ProgressBar } from './ProgressBar';
import { TopicProgressRow } from './TopicProgressRow';

interface SubjectProgressCardProps {
  subject: SubjectProgress;
  isExpanded?: boolean;
}

export function SubjectProgressCard({ subject, isExpanded = false }: SubjectProgressCardProps) {
  const [expanded, setExpanded] = useState(isExpanded);

  const completionPercent = calculateSubjectCompletionPercentage(
    subject.completedTopics,
    subject.totalTopics
  );

  const subjectIcons: Record<string, string> = {
    math: '📐',
    algebra: '📊',
    geometry: '📏',
    physics: '⚛️',
  };

  const subjectColors: Record<string, string> = {
    math: 'from-blue-500 to-purple-500',
    algebra: 'from-green-500 to-teal-500',
    geometry: 'from-orange-500 to-red-500',
    physics: 'from-indigo-500 to-blue-500',
  };

  return (
    <div className='overflow-hidden rounded-xl border bg-card'>
      {/* Header */}
      <div className='p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-4'>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${
                subjectColors[subject.subject] || 'from-gray-500 to-gray-600'
              }`}
            >
              {subjectIcons[subject.subject] || '📚'}
            </div>
            <div>
              <h3 className='text-lg font-semibold'>{subject.title}</h3>
              <p className='text-sm text-muted-foreground'>{subject.description}</p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-2xl font-bold'>{completionPercent}%</p>
            <p className='text-sm text-muted-foreground'>завершено</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='mt-4'>
          <ProgressBar percent={completionPercent} size='sm' color='gradient' showPercentage={false} />
        </div>

        {/* Stats */}
        <div className='mt-4 grid grid-cols-4 gap-4 text-center'>
          <div>
            <p className='text-lg font-semibold'>{subject.totalTopics}</p>
            <p className='text-xs text-muted-foreground'>Тем</p>
          </div>
          <div>
            <p className='text-lg font-semibold text-green-600 dark:text-green-400'>
              {subject.completedTopics}
            </p>
            <p className='text-xs text-muted-foreground'>Завершено</p>
          </div>
          <div>
            <p className='text-lg font-semibold text-blue-600 dark:text-blue-400'>
              {subject.inProgressTopics}
            </p>
            <p className='text-xs text-muted-foreground'>В процесі</p>
          </div>
          <div>
            <p className='text-lg font-semibold'>{formatXP(subject.totalXp)}</p>
            <p className='text-xs text-muted-foreground'>XP</p>
          </div>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className='mt-4 flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-accent'
        >
          {expanded ? 'Згорнути' : 'Показати теми'}
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </button>
      </div>

      {/* Topics List */}
      {expanded && (
        <div className='border-t bg-muted/30'>
          <div className='divide-y'>
            {subject.topics.map((topic) => (
              <TopicProgressRow key={topic.slug} topic={topic} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
