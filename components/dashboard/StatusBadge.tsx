'use client';

import {
  getMasteryStatusLabel,
  getDifficultyLabel,
  getDifficultyColorClass,
} from '@/lib/dashboard/progressUtils';

type BadgeVariant =
  | 'hot'
  | 'mastered'
  | 'in-progress'
  | 'not-started'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'default';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    hot: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    mastered:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    'in-progress':
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'not-started':
      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    beginner:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    intermediate:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    advanced:
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    default:
      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  };

  const variantLabels: Record<BadgeVariant, string> = {
    hot: 'Гаряча тема',
    mastered: 'Опановано',
    'in-progress': 'В процесі',
    'not-started': 'Не розпочато',
    beginner: 'Початковий',
    intermediate: 'Середній',
    advanced: 'Складний',
    default: '',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        variantClasses[variant]
      } ${className || ''}`}
    >
      {variant === 'hot' && (
        <svg
          className='h-3 w-3'
          fill='currentColor'
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd'
            d='M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z'
            clipRule='evenodd'
          />
        </svg>
      )}
      {variant === 'mastered' && (
        <svg
          className='h-3 w-3'
          fill='currentColor'
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd'
            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
            clipRule='evenodd'
          />
        </svg>
      )}
      {children || variantLabels[variant]}
    </span>
  );
}

interface MasteryBadgeProps {
  status: 'beginner' | 'intermediate' | 'advanced' | 'mastered';
  className?: string;
}

export function MasteryBadge({ status, className }: MasteryBadgeProps) {
  const variantMap: Record<string, BadgeVariant> = {
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
    mastered: 'mastered',
  };

  return (
    <StatusBadge variant={variantMap[status]} className={className}>
      {getMasteryStatusLabel(status)}
    </StatusBadge>
  );
}

interface DifficultyBadgeProps {
  difficulty: string | null;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  if (!difficulty) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDifficultyColorClass(
        difficulty
      )} ${className || ''}`}
    >
      {getDifficultyLabel(difficulty)}
    </span>
  );
}

interface HotTopicBadgeProps {
  className?: string;
}

export function HotTopicBadge({ className }: HotTopicBadgeProps) {
  return <StatusBadge variant='hot' className={className} />;
}
