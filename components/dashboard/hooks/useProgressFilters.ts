'use client';

import { useState, useMemo, useEffect } from 'react';
import { ProgressFilters, TopicProgress, SubjectProgress } from '@/types/dashboard';
import { filterTopics, sortTopics } from '@/lib/dashboard/progressUtils';

interface UseProgressFiltersReturn {
  filters: ProgressFilters;
  setFilters: React.Dispatch<React.SetStateAction<ProgressFilters>>;
  filteredTopics: TopicProgress[];
  filteredSubjects: SubjectProgress[];
  topicsCount: number;
}

const STORAGE_KEY = 'dashboard-filters';

const defaultFilters: ProgressFilters = {
  subjects: [],
  completionStatus: 'all',
  difficulty: 'all',
  timePeriod: 'all',
  searchQuery: '',
  sortBy: 'name',
  sortOrder: 'asc',
};

export function useProgressFilters(
  allTopics: TopicProgress[],
  subjects: SubjectProgress[]
): UseProgressFiltersReturn {
  // Load filters from localStorage on mount
  const [filters, setFilters] = useState<ProgressFilters>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return { ...defaultFilters, ...JSON.parse(saved) };
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    return defaultFilters;
  });

  // Save filters to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [filters]);

  // Filter and sort topics
  const filteredTopics = useMemo(() => {
    let topics = [...allTopics];

    // Apply filters
    topics = filterTopics(topics, filters);

    // Apply sorting
    topics = sortTopics(topics, filters.sortBy, filters.sortOrder);

    return topics;
  }, [allTopics, filters]);

  // Filter subjects based on selected subjects
  const filteredSubjects = useMemo(() => {
    if (filters.subjects.length === 0) {
      return subjects;
    }
    return subjects.filter((subject) => filters.subjects.includes(subject.subject));
  }, [subjects, filters.subjects]);

  return {
    filters,
    setFilters,
    filteredTopics,
    filteredSubjects,
    topicsCount: filteredTopics.length,
  };
}
