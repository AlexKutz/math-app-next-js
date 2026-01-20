export interface TMultipleChoiceTask {
  id: string;
  type: 'multiple-choice';
  description?: string;
  question: string;
  options: { text: string; comment?: string | null }[];
  answer: number;
}

export interface TInputTask {
  id: string;
  type: 'input';
  description?: string;
  question: string;
  placeholder: string;
  correct: '3/12';
  accepted: ['3/12', '1/4'];
}

export type TTask = TMultipleChoiceTask | TInputTask;
