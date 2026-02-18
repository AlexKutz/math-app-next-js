'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardData } from '@/types/dashboard';

interface UseProgressDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProgressData(): UseProgressDataReturn {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (status === 'loading') return;

    if (!session?.user?.id) {
      setIsLoading(false);
      setError('Необхідно увійти в систему');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/progress');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Необхідно увійти в систему');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка завантаження даних');
      }

      const result: DashboardData = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка');
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
