export interface MultipleChoiceTaskData {
  id: string
  type: 'multiple-choice'
  question: string
  options: string[]
  answer: number
}
