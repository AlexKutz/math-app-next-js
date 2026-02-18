'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useProgressData } from '@/components/dashboard/hooks/useProgressData';
import { TopicProgress } from '@/types/dashboard';
import { SubjectPageData } from './SubjectPage';
import { HiListBullet } from 'react-icons/hi2';
import { BsGrid } from 'react-icons/bs';

// Map subject path to subject key used in API
const subjectKeyMap: Record<string, string> = {
  '/math': 'math',
  '/algebra': 'algebra',
  '/geometry': 'geometry',
  '/physics': 'physics',
};

// Get topic status based on progress data
function getTopicStatus(
  folder: string,
  subjectKey: string,
  topicsProgress: TopicProgress[]
): 'not-started' | 'in-progress' | 'completed' {
  const topicProgress = topicsProgress.find(
    (t) => t.slug === folder && t.subject === subjectKey
  );

  if (!topicProgress) return 'not-started';
  if (topicProgress.isCompleted) return 'completed';
  if (topicProgress.level > 0 || topicProgress.totalXpEarned > 0) return 'in-progress';
  return 'not-started';
}

interface SubjectPageClientProps {
  data: SubjectPageData;
  basePath: string;
}

const STORAGE_KEY = 'subject-page-view-mode';

export function SubjectPageClient({ data, basePath }: SubjectPageClientProps) {
  const { data: session } = useSession();
  const { data: progressData } = useProgressData();
  
  // Initialize state from localStorage or default to false (list view)
  const [isCompactView, setIsCompactView] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });
  
  const subjectKey = subjectKeyMap[basePath] || '';
  
  // Save to localStorage when view mode changes
  const handleToggle = () => {
    const newValue = !isCompactView;
    setIsCompactView(newValue);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  // Get topics progress for this subject
  const topicsProgress = progressData?.allTopics.filter(
    (t) => t.subject === subjectKey
  ) || [];

  const isAuthenticated = !!session?.user?.id;

  return (
    <div className='space-y-10'>
      <ViewToggle isCompact={isCompactView} onToggle={handleToggle} />
      {data.sections.map((section, index) => (
        <TopicSection
          key={section.title}
          section={section}
          index={index}
          basePath={basePath}
          topicsProgress={isAuthenticated ? topicsProgress : []}
          showStatus={isAuthenticated}
          isCompact={isCompactView}
        />
      ))}
    </div>
  );
}

// View Toggle Component
interface ViewToggleProps {
  isCompact: boolean;
  onToggle: () => void;
}

function ViewToggle({ isCompact, onToggle }: ViewToggleProps) {
  return (
    <div className='flex items-center justify-end gap-3 pb-2 border-b border-border'>
      <div className='flex items-center gap-1 rounded-lg border border-border bg-card p-1'>
        <button
          onClick={onToggle}
          className={`flex items-center cursor-pointer gap-1.5 rounded-md pr-1 justify-center w-28 py-2.5 text-sm font-medium transition-colors ${
            !isCompact
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={!isCompact}
        >
          <HiListBullet className='h-5 w-5' />
          Список
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center cursor-pointer gap-1.5 rounded-md pr-1 justify-center w-28 py-2.5 text-sm font-medium transition-colors ${
            isCompact
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={isCompact}
        >
          <BsGrid className='h-4 w-4' />
          Сітка
        </button>
      </div>
    </div>
  );
}

// Compact Grid Components
interface CompactLessonsGridProps {
  lessons: { title: string; folder: string }[];
  basePath: string;
  topicsProgress: TopicProgress[];
  showStatus: boolean;
}

function CompactLessonsGrid({ lessons, basePath, topicsProgress, showStatus }: CompactLessonsGridProps) {
  const subjectKey = subjectKeyMap[basePath] || '';

  return (
    <div className='flex flex-wrap gap-2'>
      {lessons.map((lesson, index) => (
        <CompactLessonItem
          key={lesson.folder}
          lesson={lesson}
          position={index + 1}
          basePath={basePath}
          status={showStatus ? getTopicStatus(lesson.folder, subjectKey, topicsProgress) : null}
        />
      ))}
    </div>
  );
}

interface CompactLessonItemProps {
  lesson: { title: string; folder: string };
  position: number;
  basePath: string;
  status: 'not-started' | 'in-progress' | 'completed' | null;
}

function CompactLessonItem({ lesson, position, basePath, status }: CompactLessonItemProps) {
  const lessonHref = `${basePath}/${lesson.folder}/lesson`;

  const statusStyles = {
    'not-started': 'bg-card border-border hover:bg-muted/50',
    'in-progress': 'bg-blue-100 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/30 dark:border-blue-700 dark:hover:bg-blue-900/50',
    'completed': 'bg-green-100 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:border-green-700 dark:hover:bg-green-900/50',
  };

  const currentStyle = status ? statusStyles[status] : statusStyles['not-started'];

  return (
    <Link
      href={lessonHref}
      className={`flex items-center justify-center w-10 h-10 rounded-lg border text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${currentStyle}`}
      aria-label={`Урок ${position}: ${lesson.title}${status ? `, ${status === 'completed' ? 'завершено' : status === 'in-progress' ? 'в процесі' : 'не розпочато'}` : ''}`}
      title={lesson.title}
    >
      {position}
    </Link>
  );
}

interface TopicSectionProps {
  section: {
    title: string;
    description?: string;
    lessons: { title: string; folder: string }[];
  };
  index: number;
  basePath: string;
  topicsProgress: TopicProgress[];
  showStatus: boolean;
  isCompact: boolean;
}

function TopicSection({ section, index, basePath, topicsProgress, showStatus, isCompact }: TopicSectionProps) {
  const totalCount = section.lessons.length;

  return (
    <section className='space-y-5' aria-labelledby={`section-${index}`}>
      <SectionHeader
        id={`section-${index}`}
        title={section.title}
        description={section.description}
        total={totalCount}
      />
      {isCompact ? (
        <CompactLessonsGrid
          lessons={section.lessons}
          basePath={basePath}
          topicsProgress={topicsProgress}
          showStatus={showStatus}
        />
      ) : (
        <LessonsList
          lessons={section.lessons}
          basePath={basePath}
          topicsProgress={topicsProgress}
          showStatus={showStatus}
        />
      )}
    </section>
  );
}

interface SectionHeaderProps {
  id: string;
  title: string;
  description?: string;
  total: number;
}

function SectionHeader({ id, title, description, total }: SectionHeaderProps) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <h2 id={id} className='text-2xl font-semibold text-foreground'>
          {title}
        </h2>
      </div>
      {description && (
        <p className='text-base text-muted-foreground'>{description}</p>
      )}
    </div>
  );
}

interface LessonsListProps {
  lessons: { title: string; folder: string }[];
  basePath: string;
  topicsProgress: TopicProgress[];
  showStatus: boolean;
}

function LessonsList({ lessons, basePath, topicsProgress, showStatus }: LessonsListProps) {
  const subjectKey = subjectKeyMap[basePath] || '';

  return (
    <ol className='flex flex-col gap-2'>
      {lessons.map((lesson, index) => (
        <LessonListItem
          key={lesson.folder}
          lesson={lesson}
          position={index + 1}
          basePath={basePath}
          status={showStatus ? getTopicStatus(lesson.folder, subjectKey, topicsProgress) : null}
        />
      ))}
    </ol>
  );
}

interface LessonListItemProps {
  lesson: { title: string; folder: string };
  position: number;
  basePath: string;
  status: 'not-started' | 'in-progress' | 'completed' | null;
}

function LessonListItem({ lesson, position, basePath, status }: LessonListItemProps) {
  const lessonHref = `${basePath}/${lesson.folder}/lesson`;

  const statusConfig = {
    'not-started': {
      label: 'не розпочато',
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    },
    'in-progress': {
      label: 'в процесі',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    },
    'completed': {
      label: 'завершено',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    },
  };

  return (
    <li>
      <Link
        href={lessonHref}
        className='group flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-border bg-card transition-colors duration-150 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        aria-label={`Урок ${position}: ${lesson.title}${status ? `, ${statusConfig[status].label}` : ''}`}
      >
        <div className='flex items-center gap-4 min-w-0'>
          <span className='flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium text-muted-foreground group-hover:bg-muted group-hover:text-foreground transition-colors duration-150'>
            {position}
          </span>
          <span className='text-base font-medium text-foreground group-hover:text-foreground transition-colors duration-150 truncate'>
            {lesson.title}
          </span>
        </div>
        {status && (
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[status].className}`}>
            {statusConfig[status].label}
          </span>
        )}
      </Link>
    </li>
  );
}
