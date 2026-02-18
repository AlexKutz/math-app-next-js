'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useProgressData } from '@/components/dashboard/hooks/useProgressData';
import { TopicProgress } from '@/types/dashboard';
import { SubjectPageData } from './SubjectPage';

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

export function SubjectPageClient({ data, basePath }: SubjectPageClientProps) {
  const { data: session } = useSession();
  const { data: progressData } = useProgressData();
  const subjectKey = subjectKeyMap[basePath] || '';

  // Get topics progress for this subject
  const topicsProgress = progressData?.allTopics.filter(
    (t) => t.subject === subjectKey
  ) || [];

  const isAuthenticated = !!session?.user?.id;

  return (
    <div className='space-y-10'>
      {data.sections.map((section, index) => (
        <TopicSection
          key={section.title}
          section={section}
          index={index}
          basePath={basePath}
          topicsProgress={isAuthenticated ? topicsProgress : []}
          showStatus={isAuthenticated}
        />
      ))}
    </div>
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
}

function TopicSection({ section, index, basePath, topicsProgress, showStatus }: TopicSectionProps) {
  const totalCount = section.lessons.length;

  return (
    <section className='space-y-5' aria-labelledby={`section-${index}`}>
      <SectionHeader
        id={`section-${index}`}
        title={section.title}
        description={section.description}
        total={totalCount}
      />
      <LessonsList 
        lessons={section.lessons} 
        basePath={basePath} 
        topicsProgress={topicsProgress}
        showStatus={showStatus}
      />
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
