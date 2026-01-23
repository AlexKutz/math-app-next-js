export interface TMultipleChoiceTask {
  id: string;
  type: 'multiple-choice';
  description?: string;
  question: string;
  options: { text: string; comment?: string | null }[];
  answer: number;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  baseXP?: number;
}

export interface TInputTask {
  id: string;
  type: 'input';
  description?: string;
  question: string;
  placeholder: string;
  correct: string;
  accepted: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  baseXP?: number;
}

export type TTask = TMultipleChoiceTask | TInputTask;
