export interface User {
  uid: string
  email: string
  displayName: string
  role: 'student' | 'teacher' | 'admin'
  createdAt: Date
}

export interface Test {
  id: string
  title: string
  description: string
  createdBy: string
  createdAt: Date
  duration: number
  isPublished: boolean
  questionsCount: number
}

export interface Question {
  id: string
  testId: string
  text: string
  type: 'single' | 'multiple' | 'text'
  options?: string[] // для типов с вариантами
  correctAnswers?: string[] // индексы или значения
  points: number
  order: number
  explanation?: string // объяснение правильного ответа
}

export interface TestAttempt {
  id: string
  testId: string
  userId: string
  startedAt: Date
  completedAt?: Date
  answers: {
    questionId: string
    userAnswer: string | string[]
    isCorrect?: boolean
    pointsEarned: number
  }[]
  totalScore: number
  status: 'in-progress' | 'completed' | 'expired'
}
