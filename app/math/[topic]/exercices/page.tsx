import { MultipleChoiceTask } from '@/components/tasks/MultipleChoiceTask'
import { loadTasks } from '@/lib/loadTasks'
import Link from 'next/link'
import { join } from 'path'

export default async function Page({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params

  const tasksDir = join(process.cwd(), 'content/math', topic, 'tasks')

  const tasks = loadTasks(tasksDir)

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <Link href={`/math/${topic}/lesson`} className="text-blue-600 underline">
        Back to Lesson
      </Link>
      <MultipleChoiceTask task={tasks[0]} />
    </div>
  )
}
