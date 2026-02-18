import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/authConfig';
import { XPService } from '@/lib/xp/xpService';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  DashboardData,
  ProgressOverview,
  SubjectProgress,
  TopicProgress,
  SubjectData,
} from '@/types/dashboard';
import { UserTopicXP, TopicXPConfig } from '@/types/xp';

const SUBJECTS = [
  { key: 'math', path: 'math' },
  { key: 'algebra', path: 'algebra' },
  { key: 'geometry', path: 'geometry' },
  { key: 'physics', path: 'physics' },
];

async function loadSubjectData(subjectPath: string): Promise<SubjectData | null> {
  try {
    const filePath = join(process.cwd(), 'content', subjectPath, 'allTopics.json');
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as SubjectData;
  } catch (error) {
    console.error(`Failed to load subject data for ${subjectPath}:`, error);
    return null;
  }
}

function calculateMasteryStatus(level: number): 'beginner' | 'intermediate' | 'advanced' | 'mastered' {
  if (level >= 5) return 'mastered';
  if (level >= 3) return 'advanced';
  if (level >= 1) return 'intermediate';
  return 'beginner';
}

function isHotTopic(nextReviewDate: Date | string | null): boolean {
  if (!nextReviewDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  return reviewDate <= today;
}

function calculateProgressPercent(
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

function calculateStreaks(userTopics: UserTopicXP[]): { current: number; longest: number } {
  if (userTopics.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Get all unique activity dates
  const activityDates = new Set<string>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  for (const topic of userTopics) {
    if (topic.lastActivity) {
      const date = new Date(topic.lastActivity);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.toISOString().split('T')[0]);
    }
    if (topic.lastPracticedDate) {
      const date = new Date(topic.lastPracticedDate);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.toISOString().split('T')[0]);
    }
  }

  const sortedDates = Array.from(activityDates).sort().reverse();
  
  if (sortedDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  // Check if there's activity today, otherwise start from yesterday
  const hasActivityToday = sortedDates.includes(todayStr);
  if (!hasActivityToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (const dateStr of sortedDates) {
    const checkDateStr = checkDate.toISOString().split('T')[0];
    if (dateStr === checkDateStr) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (new Date(dateStr) < checkDate) {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let previousDate: Date | null = null;

  const sortedAsc = [...sortedDates].sort();
  for (const dateStr of sortedAsc) {
    const currentDate = new Date(dateStr);
    
    if (!previousDate) {
      tempStreak = 1;
    } else {
      const diffTime = currentDate.getTime() - previousDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    previousDate = currentDate;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all user XP data
    const userTopicsXP = await XPService.getUserAllTopicsXP(userId);
    
    // Create a map for quick lookup
    const userXPMap = new Map<string, UserTopicXP>();
    for (const xp of userTopicsXP) {
      userXPMap.set(xp.topicSlug, xp);
    }

    // Calculate overview statistics
    const streaks = calculateStreaks(userTopicsXP);
    const totalXpEarned = userTopicsXP.reduce((sum, xp) => sum + xp.totalXpEarned, 0);
    
    // Find last activity date
    let lastActivityDate: Date | null = null;
    for (const xp of userTopicsXP) {
      if (xp.lastActivity) {
        const activityDate = new Date(xp.lastActivity);
        if (!lastActivityDate || activityDate > lastActivityDate) {
          lastActivityDate = activityDate;
        }
      }
    }

    // Process each subject
    const subjects: SubjectProgress[] = [];
    const allTopics: TopicProgress[] = [];
    let globalTotalTopics = 0;
    let globalCompletedTopics = 0;
    let globalInProgressTopics = 0;
    let globalHotTopicsCount = 0;

    for (const subject of SUBJECTS) {
      const subjectData = await loadSubjectData(subject.path);
      if (!subjectData) continue;

      const subjectTopics: TopicProgress[] = [];
      let subjectTotalXp = 0;
      let subjectCompleted = 0;
      let subjectInProgress = 0;
      let subjectNotStarted = 0;

      // Process each section and its lessons
      for (const section of subjectData.sections) {
        for (const lesson of section.lessons) {
          globalTotalTopics++;
          
          const userXP = userXPMap.get(lesson.folder);
          const topicConfig = await XPService.getTopicConfig(lesson.folder);
          
          // Calculate progress
          let currentXp = 0;
          let totalXpEarned = 0;
          let level = 0;
          let nextLevelXp: number | null = null;
          let currentLevelMinXp: number | null = null;
          let isHot = false;
          let nextReviewDate: Date | null = null;
          let lastActivity: Date | null = null;

          if (userXP) {
            currentXp = userXP.currentXp;
            totalXpEarned = userXP.totalXpEarned;
            level = userXP.level;
            nextLevelXp = userXP.nextLevelXp ?? null;
            currentLevelMinXp = userXP.currentLevelMinXp ?? null;
            nextReviewDate = userXP.nextReviewDate ? new Date(userXP.nextReviewDate) : null;
            lastActivity = userXP.lastActivity ? new Date(userXP.lastActivity) : null;
            isHot = isHotTopic(nextReviewDate);
            
            subjectTotalXp += totalXpEarned;

            if (level >= 5) {
              subjectCompleted++;
              globalCompletedTopics++;
            } else if (level > 0 || totalXpEarned > 0) {
              subjectInProgress++;
              globalInProgressTopics++;
            } else {
              subjectNotStarted++;
            }

            if (isHot && level < 5) {
              globalHotTopicsCount++;
            }
          } else {
            subjectNotStarted++;
          }

          const progressPercent = calculateProgressPercent(
            currentXp,
            currentLevelMinXp,
            nextLevelXp
          );

          const isCompleted = level >= 5;
          const masteryStatus = calculateMasteryStatus(level);

          // Estimate total tasks (this could be enhanced to load actual task counts)
          const totalTasks = topicConfig?.dailyFullTasks 
            ? topicConfig.dailyFullTasks + (topicConfig.dailyHalfTasks || 0)
            : 20;

          const topicProgress: TopicProgress = {
            slug: lesson.folder,
            title: lesson.title,
            subject: subject.key,
            sectionTitle: section.title,
            difficulty: topicConfig?.difficulty || null,
            currentXp,
            totalXpEarned,
            level,
            nextLevelXp,
            currentLevelMinXp,
            progressPercent,
            isCompleted,
            isHotTopic: isHot,
            nextReviewDate,
            lastActivity,
            masteryStatus,
            tasksCompleted: Math.floor(totalXpEarned / (topicConfig?.baseTaskXp || 100)),
            totalTasks,
            lessonHref: `/${subject.path}/${lesson.folder}/lesson`,
            exercisesHref: `/${subject.path}/${lesson.folder}/exercices`,
          };

          subjectTopics.push(topicProgress);
          allTopics.push(topicProgress);
        }
      }

      subjects.push({
        subject: subject.key,
        title: subjectData.pageTitle,
        description: subjectData.pageDescription,
        totalTopics: subjectTopics.length,
        completedTopics: subjectCompleted,
        inProgressTopics: subjectInProgress,
        notStartedTopics: subjectNotStarted,
        totalXp: subjectTotalXp,
        topics: subjectTopics,
      });
    }

    const overview: ProgressOverview = {
      totalXpEarned,
      topicsCompleted: globalCompletedTopics,
      topicsInProgress: globalInProgressTopics,
      totalTopics: globalTotalTopics,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      lastActivityDate,
      hotTopicsCount: globalHotTopicsCount,
    };

    const dashboardData: DashboardData = {
      overview,
      subjects,
      allTopics,
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('Error fetching progress data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
