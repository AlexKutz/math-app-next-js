'use client';

import { useState } from 'react';
import { useProgressData } from '@/components/dashboard/hooks/useProgressData';
import { useProgressFilters } from '@/components/dashboard/hooks/useProgressFilters';
import { ProgressOverview } from '@/components/dashboard/ProgressOverview';
import { SubjectProgressCard } from '@/components/dashboard/SubjectProgressCard';
import { TopicProgressRow } from '@/components/dashboard/TopicProgressRow';
import { ProgressFilters } from '@/components/dashboard/ProgressFilters';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

type TabType = 'overview' | 'subjects' | 'topics' | 'hot';

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { data, isLoading, error, refetch } = useProgressData();

  const allTopics = data?.allTopics || [];
  const subjects = data?.subjects || [];

  const { filters, setFilters, filteredTopics, filteredSubjects, topicsCount } =
    useProgressFilters(allTopics, subjects);

  // Get hot topics
  const hotTopics = allTopics.filter((topic) => topic.isHotTopic && !topic.isCompleted);

  if (isLoading) {
    return (
      <main className='container mx-auto max-w-7xl space-y-8 px-4 py-8'>
        <Breadcrumbs items={[{ label: 'Панель прогресу' }]} />
        <div className='flex h-64 items-center justify-center'>
          <div className='text-center'>
            <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary'></div>
            <p className='mt-4 text-muted-foreground'>Завантаження даних...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='container mx-auto max-w-7xl space-y-8 px-4 py-8'>
        <Breadcrumbs items={[{ label: 'Панель прогресу' }]} />
        <div className='flex h-64 items-center justify-center'>
          <div className='text-center'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'>
              <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <p className='mt-4 text-muted-foreground'>{error}</p>
            <button
              onClick={() => refetch()}
              className='mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
            >
              Спробувати знову
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className='container mx-auto max-w-7xl space-y-8 px-4 py-8'>
        <Breadcrumbs items={[{ label: 'Панель прогресу' }]} />
        <div className='flex h-64 items-center justify-center'>
          <p className='text-muted-foreground'>Немає даних для відображення</p>
        </div>
      </main>
    );
  }

  return (
    <main className='container mx-auto max-w-7xl space-y-8 px-4 py-8'>
      <Breadcrumbs items={[{ label: 'Панель прогресу' }]} />

      {/* Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Панель прогресу</h1>
        <p className='text-lg text-muted-foreground'>
          Відстежуйте свій прогрес навчання та плануйте наступні кроки
        </p>
      </div>

      {/* Tabs */}
      <div className='border-b'>
        <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Огляд
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'subjects'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Предмети
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'topics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Всі теми
            {topicsCount > 0 && activeTab === 'topics' && (
              <span className='ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary'>
                {topicsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('hot')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'hot'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Для повторення
            {hotTopics.length > 0 && (
              <span className='ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'>
                {hotTopics.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className='space-y-6'>
        {activeTab === 'overview' && (
          <div className='space-y-8'>
            <ProgressOverview overview={data.overview} />

            {/* Quick Access: Hot Topics */}
            {hotTopics.length > 0 && (
              <div className='rounded-xl border bg-card p-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-semibold'>Теми для повторення</h3>
                  <button
                    onClick={() => setActiveTab('hot')}
                    className='text-sm font-medium text-primary hover:underline'
                  >
                    Переглянути всі
                  </button>
                </div>
                <div className='divide-y'>
                  {hotTopics.slice(0, 3).map((topic) => (
                    <TopicProgressRow key={topic.slug} topic={topic} showSubject />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Access: In Progress */}
            {data.allTopics.some((t) => t.level > 0 && !t.isCompleted) && (
              <div className='rounded-xl border bg-card p-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-semibold'>Продовжити навчання</h3>
                  <button
                    onClick={() => setActiveTab('topics')}
                    className='text-sm font-medium text-primary hover:underline'
                  >
                    Переглянути всі
                  </button>
                </div>
                <div className='divide-y'>
                  {data.allTopics
                    .filter((t) => t.level > 0 && !t.isCompleted)
                    .slice(0, 3)
                    .map((topic) => (
                      <TopicProgressRow key={topic.slug} topic={topic} showSubject />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className='grid gap-6 md:grid-cols-2'>
            {filteredSubjects.map((subject) => (
              <SubjectProgressCard key={subject.subject} subject={subject} />
            ))}
          </div>
        )}

        {activeTab === 'topics' && (
          <div className='space-y-6'>
            <ProgressFilters
              filters={filters}
              onFiltersChange={setFilters}
              subjects={subjects}
            />

            {filteredTopics.length === 0 ? (
              <div className='flex h-64 flex-col items-center justify-center rounded-xl border bg-card'>
                <svg
                  className='h-12 w-12 text-muted-foreground'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <p className='mt-4 text-muted-foreground'>Теми не знайдено</p>
                <button
                  onClick={() =>
                    setFilters({
                      subjects: [],
                      completionStatus: 'all',
                      difficulty: 'all',
                      timePeriod: 'all',
                      searchQuery: '',
                      sortBy: 'name',
                      sortOrder: 'asc',
                    })
                  }
                  className='mt-2 text-sm font-medium text-primary hover:underline'
                >
                  Скинути фільтри
                </button>
              </div>
            ) : (
              <div className='rounded-xl border bg-card'>
                <div className='border-b bg-muted/50 px-4 py-3'>
                  <p className='text-sm text-muted-foreground'>
                    Знайдено <span className='font-medium text-foreground'>{topicsCount}</span> тем
                  </p>
                </div>
                <div className='divide-y'>
                  {filteredTopics.map((topic) => (
                    <TopicProgressRow key={topic.slug} topic={topic} showSubject />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hot' && (
          <div className='space-y-6'>
            {hotTopics.length === 0 ? (
              <div className='flex h-64 flex-col items-center justify-center rounded-xl border bg-card'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'>
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <p className='mt-4 text-lg font-medium'>Чудово!</p>
                <p className='text-muted-foreground'>Немає тем, які потребують повторення</p>
              </div>
            ) : (
              <div className='rounded-xl border bg-card'>
                <div className='border-b bg-amber-50 px-4 py-3 dark:bg-amber-900/10'>
                  <div className='flex items-center gap-2'>
                    <svg
                      className='h-5 w-5 text-amber-600 dark:text-amber-400'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z'
                        clipRule='evenodd'
                      />
                    </svg>
                    <p className='text-sm font-medium text-amber-800 dark:text-amber-300'>
                      {hotTopics.length} тем потребують повторення
                    </p>
                  </div>
                </div>
                <div className='divide-y'>
                  {hotTopics.map((topic) => (
                    <TopicProgressRow key={topic.slug} topic={topic} showSubject />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

