import { Tasks } from '@/components/tasks/Tasks';
import { loadTasks } from '@/lib/loadTasks';
import Link from 'next/link';
import { join } from 'path';
import { MdArrowBackIos } from 'react-icons/md';

export default async function Page({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;

  const tasksDir = join(process.cwd(), 'content/math', topic, 'tasks');

  const tasks = loadTasks(tasksDir);

  return (
    <div className='max-w-3xl space-y-6 pb-8'>
      <Link
        href={`/math/${topic}/lesson`}
        className='flex max-w-max items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-5 py-2 text-blue-600 no-underline shadow-sm transition hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700'
      >
        <MdArrowBackIos className='inline' />
        Повернутися до теорії
      </Link>
      <Tasks tasks={tasks} topicSlug={topic} />
    </div>
  );
}
