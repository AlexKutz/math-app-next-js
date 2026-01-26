import { Tasks } from '@/components/tasks/Tasks';
import { loadTasks } from '@/lib/loadTasks';
import Link from 'next/link';
import { join } from 'path';
import { MdArrowBackIos } from 'react-icons/md';
import { FaBookOpen } from "react-icons/fa6";

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
        className='rounded-lg bg-gray-100 px-5 py-2 text-blue-600 no-underline flex max-w-max items-center gap-2 shadow-sm border border-gray-200'
      >
        <MdArrowBackIos className='inline' />
        Повернутися до теорії
      </Link>
      <Tasks tasks={tasks} topicSlug={topic} />
    </div>
  );
}
