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
    <div className='max-w-3xl space-y-6 py-8'>
      <Link
        href={`/math/${topic}/lesson`}
        className='mb-8 inline-block rounded-lg bg-gray-200 px-5 py-2 text-blue-600 no-underline'
      >
        <MdArrowBackIos className='mb-1 inline' />
        Back to Lesson
      </Link>
      <Tasks tasks={tasks} topicSlug={topic} />
    </div>
  );
}
