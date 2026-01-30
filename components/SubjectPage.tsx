import Link from 'next/link';
import { ProgressBadge } from '@/components/math/ProgressBadge';

type Lesson = {
  title: string;
  folder: string;
};

type TopicSection = {
  title: string;
  description?: string;
  lessons: Lesson[];
};

export type SubjectPageData = {
  pageTitle: string;
  pageDescription: string;
  sections: TopicSection[];
};

type SubjectPageProps = {
  data: SubjectPageData;
  basePath: string;
};

export function SubjectPage({ data, basePath }: SubjectPageProps) {
  return (
    <main className='space-y-8 rounded-lg'>
      <PageHeader title={data.pageTitle} description={data.pageDescription} />
      <TopicsList topics={data.sections} basePath={basePath} />
    </main>
  );
}

function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className='space-y-2'>
      <h1 className='text-4xl font-bold tracking-tight text-foreground'>
        {title}
      </h1>
      <p className='text-lg text-muted-foreground'>{description}</p>
    </div>
  );
}

function TopicsList({
  topics,
  basePath,
}: {
  topics: TopicSection[];
  basePath: string;
}) {
  return (
    <div className='space-y-10'>
      {topics.map((section, index) => (
        <TopicSection
          key={section.title}
          section={section}
          index={index}
          basePath={basePath}
        />
      ))}
    </div>
  );
}

function TopicSection({
  section,
  index,
  basePath,
}: {
  section: TopicSection;
  index: number;
  basePath: string;
}) {
  const totalCount = section.lessons.length;

  return (
    <section className='space-y-5' aria-labelledby={`section-${index}`}>
      <SectionHeader
        id={`section-${index}`}
        title={section.title}
        description={section.description}
        total={totalCount}
      />
      <LessonsList lessons={section.lessons} basePath={basePath} />
    </section>
  );
}

function SectionHeader({
  id,
  title,
  description,
  total,
}: {
  id: string;
  title: string;
  description?: string;
  total: number;
}) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <h2
          id={id}
          className='text-2xl font-semibold text-foreground'
        >
          {title}
        </h2>
        <ProgressBadge sectionTitle={title} totalLessons={total} />
      </div>
      {description && (
        <p className='text-base text-muted-foreground'>
          {description}
        </p>
      )}
    </div>
  );
}

function LessonsList({
  lessons,
  basePath,
}: {
  lessons: Lesson[];
  basePath: string;
}) {
  return (
    <ol className='grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
      {lessons.map((lesson, index) => (
        <LessonCard
          key={lesson.folder}
          lesson={lesson}
          position={index + 1}
          basePath={basePath}
        />
      ))}
    </ol>
  );
}

function LessonCard({
  lesson,
  position,
  basePath,
}: {
  lesson: Lesson;
  position: number;
  basePath: string;
}) {
  const href = `${basePath}/${lesson.folder}/lesson`;

  return (
    <li className='group relative'>
      <Link
        href={href}
        className='block h-full rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary hover:shadow-md focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none dark:hover:bg-card'
        aria-label={`Урок ${position}: ${lesson.title}`}
      >
        <div className='flex h-full flex-col gap-3'>
          <div className='flex items-start justify-between gap-2'>
            <span className='text-xs font-semibold text-muted-foreground'>
              Урок {position}
            </span>
          </div>
          <h3 className='text-lg leading-snug font-semibold text-foreground group-hover:text-primary'>
            {lesson.title}
          </h3>
        </div>
      </Link>
    </li>
  );
}
