// Types for the Progress Tracking Dashboard

export interface ProgressOverview {
  totalXpEarned: number;
  topicsCompleted: number;
  topicsInProgress: number;
  totalTopics: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  hotTopicsCount: number;
}

export interface SubjectProgress {
  subject: string;
  title: string;
  description: string;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  totalXp: number;
  topics: TopicProgress[];
}

export interface TopicProgress {
  slug: string;
  title: string;
  subject: string;
  sectionTitle: string;
  difficulty: string | null;
  currentXp: number;
  totalXpEarned: number;
  level: number;
  nextLevelXp: number | null;
  currentLevelMinXp: number | null;
  progressPercent: number;
  isCompleted: boolean;
  isHotTopic: boolean;
  nextReviewDate: Date | null;
  lastActivity: Date | null;
  masteryStatus: 'beginner' | 'intermediate' | 'advanced' | 'mastered';
  tasksCompleted: number;
  totalTasks: number;
  lessonHref: string;
  exercisesHref: string;
}

export interface DashboardData {
  overview: ProgressOverview;
  subjects: SubjectProgress[];
  allTopics: TopicProgress[];
}

export type CompletionStatus = 'all' | 'completed' | 'in-progress' | 'not-started';
export type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type TimePeriod = 'all' | 'week' | 'month';
export type SortOption = 'name' | 'progress' | 'lastActivity' | 'nextReview' | 'level';

export interface ProgressFilters {
  subjects: string[];
  completionStatus: CompletionStatus;
  difficulty: DifficultyFilter;
  timePeriod: TimePeriod;
  searchQuery: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

export interface TopicLesson {
  title: string;
  folder: string;
}

export interface TopicSection {
  title: string;
  description?: string;
  lessons: TopicLesson[];
}

export interface SubjectData {
  pageTitle: string;
  pageDescription: string;
  sections: TopicSection[];
}

export interface SubjectConfig {
  key: string;
  path: string;
  data: SubjectData;
}
