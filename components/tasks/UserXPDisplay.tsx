import { useMemo } from 'react';
import { UserTopicXP, TopicXPConfig } from '@/types/xp';
import {
  calculateEnergyStats,
  getEnergyStatusText,
  getEnergyBarColor,
  isHotTopic,
  formatTimeUntilReview,
} from './utils';

interface UserXPDisplayProps {
  userXP: UserTopicXP;
  topicConfig: TopicXPConfig | null;
}

const EnergyBar = ({
  userXP,
  topicConfig,
}: {
  userXP: UserTopicXP;
  topicConfig: TopicXPConfig;
}) => {
  const energy = useMemo(
    () => calculateEnergyStats(userXP, topicConfig),
    [userXP, topicConfig],
  );

  return (
    <div className='mb-2'>
      <div className='mb-1 flex items-center justify-between text-xs'>
        <span className='text-gray-600 dark:text-gray-400'>Енергія теми</span>
        <span className='font-medium'>{getEnergyStatusText(energy)}</span>
      </div>
      <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getEnergyBarColor(energy.percentRemaining)}`}
          style={{ width: `${energy.percentRemaining}%` }}
        />
      </div>
    </div>
  );
};

const XPProgressBar = ({ userXP }: { userXP: UserTopicXP }) => {
  const progressPercent = useMemo(() => {
    if (
      typeof userXP.nextLevelXp !== 'number' ||
      typeof userXP.currentLevelMinXp !== 'number'
    ) {
      return 100;
    }
    const range = userXP.nextLevelXp - userXP.currentLevelMinXp;
    const progress = userXP.currentXp - userXP.currentLevelMinXp;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }, [userXP.currentXp, userXP.nextLevelXp, userXP.currentLevelMinXp]);

  return (
    <div className='mb-2'>
      <div className='mb-1 flex justify-between text-sm'>
        <span>{userXP.currentXp} XP</span>
        <span>
          {typeof userXP.nextLevelXp === 'number'
            ? `${userXP.nextLevelXp} XP`
            : 'MAX'}
        </span>
      </div>
      <div className='h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
        <div
          className='h-2.5 rounded-full bg-linear-to-r from-blue-600 to-purple-600 transition-all duration-500'
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export const UserXPDisplay = ({ userXP, topicConfig }: UserXPDisplayProps) => {
  const isHot = isHotTopic(userXP.nextReviewDate);
  const hasUpcomingReview =
    userXP.nextReviewDate && new Date(userXP.nextReviewDate) > new Date();

  const containerStyles = isHot
    ? 'bg-linear-to-r from-amber-50 to-yellow-50 ring-2 ring-amber-400 dark:from-amber-900/20 dark:to-yellow-900/20 dark:ring-amber-600'
    : 'bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20';

  return (
    <div className={`mb-6 rounded-lg border p-4 shadow-sm ${containerStyles}`}>
      {/* Header */}
      <div className='mb-2 flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Досвід по темі</h3>
        <div className='flex items-center gap-2'>
          {isHot && (
            <span className='rounded-full bg-amber-400 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-600 dark:text-amber-100'>
              🔥 Гаряча тема
            </span>
          )}
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            Рівень {userXP.level}
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <XPProgressBar userXP={userXP} />

      {/* Energy Bar */}
      {topicConfig && <EnergyBar userXP={userXP} topicConfig={topicConfig} />}

      {/* Review Timer */}
      {hasUpcomingReview && (
        <p className='text-xs text-gray-500 dark:text-gray-400'>
          До відновлення повного досвіду:{' '}
          {formatTimeUntilReview(new Date(userXP.nextReviewDate!))}
        </p>
      )}

      {/* Total XP */}
      <p className='text-xs text-gray-500 dark:text-gray-400'>
        Всього зароблено: {userXP.totalXpEarned} XP
      </p>
    </div>
  );
};
