// Utility functions for the Progress Dashboard

import {
  TopicProgress,
  ProgressFilters,
  CompletionStatus,
  DifficultyFilter,
  TimePeriod,
  SortOption,
} from '@/types/dashboard';

/**
 * Calculate mastery status based on level
 */
export function calculateMasteryStatus(
  level: number
): 'beginner' | 'intermediate' | 'advanced' | 'mastered' {
  if (level >= 5) return 'mastered';
  if (level >= 3) return 'advanced';
  if (level >= 1) return 'intermediate';
  return 'beginner';
}

/**
 * Check if a topic is "hot" (needs review)
 */
export function isHotTopic(nextReviewDate: Date | string | null): boolean {
  if (!nextReviewDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  return reviewDate <= today;
}

/**
 * Calculate progress percentage toward next level
 */
export function calculateProgressPercent(
  currentXp: number,
  currentLevelMinXp: number | null | undefined,
  nextLevelXp: number | null | undefined
): number {
  if (typeof nextLevelXp !== 'number' || typeof currentLevelMinXp !== 'number') {
    return 100;
  }
  const range = nextLevelXp - currentLevelMinXp;
  if (range <= 0) return 100;
  const progress = currentXp - currentLevelMinXp;
  return Math.min(100, Math.max(0, (progress / range) * 100));
}

/**
 * Format date for display in Ukrainian
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 days ago", "today")
 */
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return '—';
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Сьогодні';
  if (diffDays === 1) return 'Вчора';
  if (diffDays < 7) return `${diffDays} днів тому`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} тижнів тому`;
  
  return formatDate(date);
}

/**
 * Format time until review date
 */
export function formatTimeUntilReview(date: Date | string | null): string {
  if (!date) return '—';
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const reviewDate = new Date(date);
  reviewDate.setHours(0, 0, 0, 0);
  
  const diffTime = reviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'Сьогодні';
  if (diffDays === 1) return 'Завтра';
  if (diffDays < 7) return `Через ${diffDays} дні`;
  if (diffDays < 30) return `Через ${Math.floor(diffDays / 7)} тижні`;
  
  return formatDate(date);
}

/**
 * Get Ukrainian label for mastery status
 */
export function getMasteryStatusLabel(
  status: 'beginner' | 'intermediate' | 'advanced' | 'mastered'
): string {
  const labels: Record<string, string> = {
    beginner: 'Початківець',
    intermediate: 'Середній',
    advanced: 'Просунутий',
    mastered: 'Опановано',
  };
  return labels[status] || status;
}

/**
 * Get Ukrainian label for difficulty
 */
export function getDifficultyLabel(difficulty: string | null): string {
  if (!difficulty) return '—';
  const labels: Record<string, string> = {
    beginner: 'Початковий',
    intermediate: 'Середній',
    advanced: 'Складний',
  };
  return labels[difficulty] || difficulty;
}

/**
 * Get color class for difficulty badge
 */
export function getDifficultyColorClass(difficulty: string | null): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
}

/**
 * Filter topics based on filter criteria
 */
export function filterTopics(
  topics: TopicProgress[],
  filters: ProgressFilters
): TopicProgress[] {
  return topics.filter((topic) => {
    // Subject filter
    if (filters.subjects.length > 0 && !filters.subjects.includes(topic.subject)) {
      return false;
    }

    // Completion status filter
    if (filters.completionStatus !== 'all') {
      switch (filters.completionStatus) {
        case 'completed':
          if (!topic.isCompleted) return false;
          break;
        case 'in-progress':
          if (topic.isCompleted || topic.level === 0) return false;
          break;
        case 'not-started':
          if (topic.level > 0 || topic.totalXpEarned > 0) return false;
          break;
      }
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      if (topic.difficulty !== filters.difficulty) return false;
    }

    // Time period filter
    if (filters.timePeriod !== 'all' && topic.lastActivity) {
      const now = new Date();
      const activityDate = new Date(topic.lastActivity);
      const diffDays = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
      
      switch (filters.timePeriod) {
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
      }
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = topic.title.toLowerCase().includes(query);
      const matchesSection = topic.sectionTitle.toLowerCase().includes(query);
      if (!matchesTitle && !matchesSection) return false;
    }

    return true;
  });
}

/**
 * Sort topics based on sort option
 */
export function sortTopics(
  topics: TopicProgress[],
  sortBy: SortOption,
  sortOrder: 'asc' | 'desc'
): TopicProgress[] {
  const sorted = [...topics].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'progress':
        comparison = a.progressPercent - b.progressPercent;
        break;
      case 'lastActivity':
        const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case 'nextReview':
        const reviewA = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : Infinity;
        const reviewB = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : Infinity;
        comparison = reviewA - reviewB;
        break;
      case 'level':
        comparison = a.level - b.level;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Get completion status label in Ukrainian
 */
export function getCompletionStatusLabel(status: CompletionStatus): string {
  const labels: Record<CompletionStatus, string> = {
    all: 'Всі',
    completed: 'Завершено',
    'in-progress': 'В процесі',
    'not-started': 'Не розпочато',
  };
  return labels[status];
}

/**
 * Get difficulty filter label in Ukrainian
 */
export function getDifficultyFilterLabel(difficulty: DifficultyFilter): string {
  const labels: Record<DifficultyFilter, string> = {
    all: 'Всі рівні',
    beginner: 'Початковий',
    intermediate: 'Середній',
    advanced: 'Складний',
  };
  return labels[difficulty];
}

/**
 * Get time period label in Ukrainian
 */
export function getTimePeriodLabel(period: TimePeriod): string {
  const labels: Record<TimePeriod, string> = {
    all: 'За весь час',
    week: 'За останній тиждень',
    month: 'За останній місяць',
  };
  return labels[period];
}

/**
 * Get sort option label in Ukrainian
 */
export function getSortOptionLabel(option: SortOption): string {
  const labels: Record<SortOption, string> = {
    name: 'Назва',
    progress: 'Прогрес',
    lastActivity: 'Остання активність',
    nextReview: 'Наступне повторення',
    level: 'Рівень',
  };
  return labels[option];
}

/**
 * Format XP number with thousand separators
 */
export function formatXP(xp: number): string {
  return xp.toLocaleString('uk-UA');
}

/**
 * Calculate subject completion percentage
 */
export function calculateSubjectCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
