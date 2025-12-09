import { MultipleChoiceTaskData } from '@/types/task'
import fs from 'fs'
import path from 'path'

export function loadTasks(tasksDir: string): MultipleChoiceTaskData[] {
  if (!fs.existsSync(tasksDir)) return []

  const files = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.json'))

  const tasks: MultipleChoiceTaskData[] = []

  for (const file of files) {
    const fullPath = path.join(tasksDir, file)
    const raw = fs.readFileSync(fullPath, 'utf8')

    try {
      const data = JSON.parse(raw)

      tasks.push({
        id: file.replace('.json', ''),
        ...data,
      })
    } catch (e) {
      console.error(`❌ Error parsing task file ${file}:`, e)
    }
  }

  return tasks
}
