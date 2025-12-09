'use client'

import { MultipleChoiceTaskData } from '@/types/task'
import { useState } from 'react'

export function MultipleChoiceTask({ task }: { task: MultipleChoiceTaskData }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [state, setState] = useState<'correct' | 'wrong' | null>(null)

  const handleSelect = (index: number) => {
    if (selected !== null) return

    setSelected(index)

    if (index === task.answer) {
      setState('correct')
    }
    {
      setState('wrong')
    }
  }

  return (
    <div className="border p-4 rounded-xl shadow-sm bg-white">
      <p className="font-medium mb-3">{task.question}</p>

      <div className="flex flex-col gap-2">
        {task.options.map((opt, i) => {
          // цвет вариантов после проверки
          const isCorrect = selected !== null && i === task.answer
          const isWrong = selected && selected === i && i !== task.answer

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`
                text-left p-3 rounded-lg border transition 
                ${isCorrect ? 'bg-green-100 border-green-600' : ''}
                ${isWrong ? 'bg-red-100 border-red-600' : ''}
              `}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
