import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TopicXPConfig, UserTopicXP } from '@/types/xp';
import { GETXpUserResponse as UserXPResponse } from '@/types/xp';

interface UseUserXPProps {
  topicSlug: string;
}

/**
 * Custom hook for managing user XP data fetching and state
 * Handles loading user XP data and topic configuration from the API
 */
export const useUserXP = ({ topicSlug }: UseUserXPProps) => {
  const { data: session, status } = useSession();
  const [userXP, setUserXP] = useState<UserTopicXP | null>(null);
  const [topicConfig, setTopicConfig] = useState<TopicXPConfig | null>(null);
  const [isXPLoaded, setIsXPLoaded] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  /**
   * Fetches user XP data and completed tasks from the API
   */
  useEffect(() => {
    if (status === 'loading') return;

    const fetchUserXP = async () => {
      try {
        const response = await fetch(`/api/xp/user?topicSlug=${topicSlug}`);
        if (response.ok) {
          const data: UserXPResponse = await response.json();
          setUserXP(data.userXP);
          setTopicConfig(data.topicConfig);

          if (data.completedTaskIds) {
            const completedIds = new Set(
              data.completedTaskIds.map((t) => t.taskId),
            );
            setCompletedTaskIds(completedIds);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user XP:', error);
      } finally {
        setIsXPLoaded(true);
      }
    };

    if (session?.user?.id) {
      fetchUserXP();
    } else {
      setIsXPLoaded(true);
    }
  }, [session, status, topicSlug]);

  return {
    userXP,
    setUserXP,
    topicConfig,
    setTopicConfig,
    isXPLoaded,
    completedTaskIds,
    setCompletedTaskIds,
  };
};