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

export interface TCoordinatePlaneTask {
  id: string;
  type: 'coordinate-plane';
  description?: string;
  question: string;
  correctPoints: Array<{ x: number; y: number }>;
  gridSize?: { minX: number; maxX: number; minY: number; maxY: number };
  allowMultiplePoints?: boolean; // true = multiple points (default), false = single point only
  axisLabelStep?: number; // Frequency of axis labels (e.g., 1 = every integer, 5 = every 5 units). Default: 1
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  baseXP?: number;
}

export type TTask = TMultipleChoiceTask | TInputTask | TCoordinatePlaneTask;
