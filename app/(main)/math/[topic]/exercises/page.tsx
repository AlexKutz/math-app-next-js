import { Suspense } from 'react';
import { Tasks } from '@/components/tasks/Tasks';
import { loadTasks } from '@/lib/loadTasks';
import { LoadLesson } from '@/lib/loadLesson';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Loader } from '@/components/ui/Loader';
import { join } from 'path';

// Separate async component for data fetching
// Receives params promise and awaits it inside Suspense
async function ExerciseContent({ 
  params 
}: { 
  params: Promise<{ topic: string }> 
}) {
  const { topic } = await params;
  
  const tasksDir = join(process.cwd(), 'content/math', topic, 'tasks');
  const lessonPath = join(process.cwd(), 'content/math', topic);

  const tasks = loadTasks(tasksDir);
  const { frontmatter } = LoadLesson(lessonPath);

  const breadcrumbItems = [
    { label: 'Математика', href: '/math' },
    { label: frontmatter.title || topic, href: `/math/${topic}/lesson` },
    { label: 'Вправи' },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <Tasks tasks={tasks} topicSlug={topic} />
    </>
  );
}

// Loading fallback for the entire page content
function ExercisePageSkeleton() {
  return (
    <div className='animate-pulse space-y-4'>
      <div className='h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700'></div>
      <div className='h-32 rounded-lg bg-gray-200 dark:bg-gray-700'></div>
    </div>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  // Note: Page component is NOT async - params promise is passed to async child
  // This allows Next.js to stream the page without blocking
  return (
    <div className='max-w-3xl space-y-6 pb-8'>
      <Suspense fallback={<ExercisePageSkeleton />}>
        <ExerciseContent params={params} />
      </Suspense>
    </div>
  );
}
