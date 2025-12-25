export function generateFractionTasks() {
  const tasks = []

  const examples = [
    [3, 9, 4, 9],
    [2, 5, 1, 5],
    [5, 8, 1, 8],
    [7, 10, 2, 10],
  ]

  for (let i = 0; i < examples.length; i++) {
    const [a, n1, b, n2] = examples[i]

    tasks.push({
      id: `fractions-add-sub-${i + 1}`,
      type: 'multiple-choice',
      question: `Обчисли: ${a}/${n1} + ${b}/${n2}`,
      options: [`${a + b}/${n1}`, `${a}/${n1}`, `${b}/${n1}`, `${a + b + 1}/${n1}`],
      answer: 0,
    })
  }

  return tasks
}
