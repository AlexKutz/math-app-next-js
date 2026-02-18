'use client';

import { ProgressFilters as ProgressFiltersType, SubjectProgress } from '@/types/dashboard';
import {
  getCompletionStatusLabel,
  getDifficultyFilterLabel,
  getTimePeriodLabel,
  getSortOptionLabel,
} from '@/lib/dashboard/progressUtils';

interface ProgressFiltersProps {
  filters: ProgressFiltersType;
  onFiltersChange: (filters: ProgressFiltersType) => void;
  subjects: SubjectProgress[];
}

export function ProgressFilters({ filters, onFiltersChange, subjects }: ProgressFiltersProps) {
  const handleSubjectToggle = (subjectKey: string) => {
    const newSubjects = filters.subjects.includes(subjectKey)
      ? filters.subjects.filter((s) => s !== subjectKey)
      : [...filters.subjects, subjectKey];
    onFiltersChange({ ...filters, subjects: newSubjects });
  };

  const subjectLabels: Record<string, string> = {
    math: 'Математика',
    algebra: 'Алгебра',
    geometry: 'Геометрія',
    physics: 'Фізика',
  };

  return (
    <div className='space-y-4 rounded-xl border bg-card p-4'>
      {/* Search */}
      <div>
        <label className='mb-2 block text-sm font-medium'>Пошук тем</label>
        <div className='relative'>
          <input
            type='text'
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            placeholder='Введіть назву теми...'
            className='w-full rounded-lg border bg-background px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
          />
          <svg
            className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
      </div>

      {/* Subject Filter */}
      <div>
        <label className='mb-2 block text-sm font-medium'>Предмети</label>
        <div className='flex flex-wrap gap-2'>
          {subjects.map((subject) => (
            <button
              key={subject.subject}
              onClick={() => handleSubjectToggle(subject.subject)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                filters.subjects.includes(subject.subject)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-accent'
              }`}
            >
              {subjectLabels[subject.subject] || subject.title}
            </button>
          ))}
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {/* Completion Status */}
        <div>
          <label className='mb-2 block text-sm font-medium'>Статус</label>
          <select
            value={filters.completionStatus}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                completionStatus: e.target.value as ProgressFiltersType['completionStatus'],
              })
            }
            className='w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
          >
            <option value='all'>{getCompletionStatusLabel('all')}</option>
            <option value='completed'>{getCompletionStatusLabel('completed')}</option>
            <option value='in-progress'>{getCompletionStatusLabel('in-progress')}</option>
            <option value='not-started'>{getCompletionStatusLabel('not-started')}</option>
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className='mb-2 block text-sm font-medium'>Складність</label>
          <select
            value={filters.difficulty}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                difficulty: e.target.value as ProgressFiltersType['difficulty'],
              })
            }
            className='w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
          >
            <option value='all'>{getDifficultyFilterLabel('all')}</option>
            <option value='beginner'>{getDifficultyFilterLabel('beginner')}</option>
            <option value='intermediate'>{getDifficultyFilterLabel('intermediate')}</option>
            <option value='advanced'>{getDifficultyFilterLabel('advanced')}</option>
          </select>
        </div>

        {/* Time Period */}
        <div>
          <label className='mb-2 block text-sm font-medium'>Період</label>
          <select
            value={filters.timePeriod}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                timePeriod: e.target.value as ProgressFiltersType['timePeriod'],
              })
            }
            className='w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
          >
            <option value='all'>{getTimePeriodLabel('all')}</option>
            <option value='week'>{getTimePeriodLabel('week')}</option>
            <option value='month'>{getTimePeriodLabel('month')}</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className='mb-2 block text-sm font-medium'>Сортування</label>
          <div className='flex gap-2'>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  sortBy: e.target.value as ProgressFiltersType['sortBy'],
                })
              }
              className='flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            >
              <option value='name'>{getSortOptionLabel('name')}</option>
              <option value='progress'>{getSortOptionLabel('progress')}</option>
              <option value='lastActivity'>{getSortOptionLabel('lastActivity')}</option>
              <option value='nextReview'>{getSortOptionLabel('nextReview')}</option>
              <option value='level'>{getSortOptionLabel('level')}</option>
            </select>
            <button
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                })
              }
              className='rounded-lg border bg-background px-3 py-2 hover:bg-accent'
              title={filters.sortOrder === 'asc' ? 'За зростанням' : 'За спаданням'}
            >
              {filters.sortOrder === 'asc' ? (
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
                  />
                </svg>
              ) : (
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className='flex justify-end border-t pt-4'>
        <button
          onClick={() =>
            onFiltersChange({
              subjects: [],
              completionStatus: 'all',
              difficulty: 'all',
              timePeriod: 'all',
              searchQuery: '',
              sortBy: 'name',
              sortOrder: 'asc',
            })
          }
          className='flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent'
        >
          <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            />
          </svg>
          Скинути фільтри
        </button>
      </div>
    </div>
  );
}
