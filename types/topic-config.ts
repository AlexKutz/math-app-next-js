export type TopicDifficulty = 'easy' | 'normal' | 'hard' | 'insane';

export interface TopicConfig {
  slug: string;
  title: string;
  description: string;
  difficulty: TopicDifficulty;
  category: string;
  inListPosition: number;
  maxXp: number;
  tags: string[];
  baseTaskXp: number;
  reviewIntervals: number[];
  dailyXpDecay: number;
  minXpPercent: number;
}
