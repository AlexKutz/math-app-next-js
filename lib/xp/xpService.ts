import { prisma } from '@/lib/prisma';
import {
  XPCalculationResult,
  UserTopicXP,
  TopicXPConfig,
  TaskDueForReview,
  UserTaskAttempt,
} from '@/types/xp';
import { Prisma } from '@prisma/client';

export class XPService {
  private static mapTopicConfigRow(row: any): TopicXPConfig {
    // Helper function to convert Decimal to number
    const toNumber = (value: any): number => {
      if (value instanceof Prisma.Decimal) {
        return Number(value);
      }
      return Number(value ?? 0);
    };

    return {
      id: row.id,
      topicSlug: row.topicSlug,
      topicTitle: row.topicTitle,
      category: row.category,
      description: row.description ?? null,
      difficulty: row.difficulty ?? null,
      maxXp: row.maxXp,
      baseTaskXp: row.baseTaskXp,
      dailyFullTasks: row.dailyFullTasks ?? 10,
      dailyHalfTasks: row.dailyHalfTasks ?? 10,
      multiplierFull: toNumber(row.multiplierFull ?? 1.0),
      multiplierHalf: toNumber(row.multiplierHalf ?? 0.5),
      multiplierLow: toNumber(row.multiplierLow ?? 0.1),
      multiplierEarly: toNumber(row.multiplierEarly ?? 0.1),
      levelThresholds: row.levelThresholds ?? [1000, 2500, 4500, 7000, 10000],
      dailyXpDecay: toNumber(row.dailyXpDecay),
      minXpPercent: toNumber(row.minXpPercent),
      reviewIntervals: row.reviewIntervals,
      tags: row.tags ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private static mapUserTopicXPRow(row: any): UserTopicXP {
    return {
      id: row.id,
      userId: row.userId,
      topicSlug: row.topicSlug,
      currentXp: row.currentXp,
      totalXpEarned: row.totalXpEarned,
      level: row.level,
      lastActivity: row.lastActivity,
      dailyTasksCount: row.dailyTasksCount ?? 0,
      dailyTasksDate: row.dailyTasksDate,
      srsStage: row.srsStage ?? 0,
      nextReviewDate: row.nextReviewDate,
      lastPracticedDate: row.lastPracticedDate,
      createdAt: row.createdAt,
    };
  }

  private static toISODateString(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private static computeLevelFromThresholds(
    currentXp: number,
    levelThresholds: number[],
  ): { level: number; currentLevelMinXp: number | null; nextLevelXp: number | null } {
    const thresholds = Array.isArray(levelThresholds)
      ? levelThresholds.filter((x) => Number.isFinite(x)).slice().sort((a, b) => a - b)
      : [1000, 2500, 4500, 7000, 10000];

    let achieved = 0;
    for (const threshold of thresholds) {
      if (currentXp >= threshold) achieved += 1;
    }

    const level = Math.min(5, Math.max(0, achieved));
    const currentLevelMinXp =
      level === 0 ? 0 : thresholds[level - 1] ?? 0;
    const nextLevelXp = thresholds[level] ?? null;
    return { level, currentLevelMinXp, nextLevelXp };
  }

  private static computeDailyMultiplier(
    config: TopicXPConfig,
    dailyTasksCountBefore: number,
  ): { multiplier: number; dailyTaskIndex: number } {
    const idx = dailyTasksCountBefore + 1; // 1-based
    const fullEnd = config.dailyFullTasks;
    const halfEnd = config.dailyFullTasks + config.dailyHalfTasks;

    if (idx <= fullEnd) {
      return { multiplier: config.multiplierFull, dailyTaskIndex: idx };
    }
    if (idx <= halfEnd) {
      return { multiplier: config.multiplierHalf, dailyTaskIndex: idx };
    }
    return { multiplier: config.multiplierLow, dailyTaskIndex: idx };
  }

  private static addDaysAsDate(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Новая основная точка: начисление XP + SRS + anti-grind в одной транзакции.
   */
  static async submitCorrectTask(
    userId: string,
    taskId: string,
    topicSlug: string,
    taskBaseXP?: number,
    taskDifficulty?: string,
  ): Promise<{ xpResult: XPCalculationResult; userXP: UserTopicXP }> {
    return await prisma.$transaction(async (tx) => {
      const configRow = await tx.topicXpConfig.findUnique({
        where: { topicSlug },
      });
      if (!configRow) {
        throw new Error(`Topic config not found for ${topicSlug}`);
      }
      const config = this.mapTopicConfigRow(configRow);

      let progressRow = await tx.userTopicXp.findUnique({
        where: {
          userId_topicSlug: {
            userId,
            topicSlug,
          },
        },
      });

      let progress: UserTopicXP | null = progressRow
        ? this.mapUserTopicXPRow(progressRow)
        : null;

      if (!progress) {
        progressRow = await tx.userTopicXp.create({
          data: {
            userId,
            topicSlug,
          },
        });
        progress = this.mapUserTopicXPRow(progressRow);
      }

      const now = new Date();
      const todayISO = this.toISODateString(now);

      const progressDateISO = progress.dailyTasksDate
        ? this.toISODateString(new Date(progress.dailyTasksDate))
        : null;
      const isNewDay = progressDateISO !== todayISO;

      const dailyTasksCountBefore = isNewDay ? 0 : progress.dailyTasksCount;

      const nextReviewISO = progress.nextReviewDate
        ? this.toISODateString(new Date(progress.nextReviewDate))
        : null;

      // Логіка визначення статусу SRS (залишається такою ж)
      const isHotTopic = !nextReviewISO || nextReviewISO <= todayISO;
      const isTooEarly = !isHotTopic;

      console.log(`nextReviewISO: ${nextReviewISO} todayISO: ${todayISO} isHotTopic: ${isHotTopic} isTooEarly: ${isTooEarly}`);

      // Calculate base XP based on task properties or config
      let baseXP = config.baseTaskXp;
      if (taskBaseXP !== undefined && taskBaseXP !== null) {
        baseXP = taskBaseXP;
      } else if (taskDifficulty) {
        const diff = taskDifficulty.toLowerCase();
        if (diff === 'easy') baseXP = 100;
        else if (diff === 'medium' || diff === 'moderate') baseXP = 250;
        else if (diff === 'hard') baseXP = 500;
      }

      // 1. Рассчитываем множник ТОЛЬКО на основе количества выполненных сегодня заданий.
      // Это гарантирует, что первые 10 получат Full, следующие 10 — Half, а дальше — Low.
      const dailyCalc = this.computeDailyMultiplier(config, dailyTasksCountBefore);
      let multiplier = dailyCalc.multiplier;
      const dailyTaskIndex = dailyCalc.dailyTaskIndex;

      // Примечание: Мы намеренно игнорируем isTooEarly при расчете множителя XP.
      // Если пользователь хочет практиковаться сверх графика, он получает XP 
      // согласно своей "дневной энергии" (Full/Half), но не продвигается по SRS.
      
      const xpEarned = Math.max(0, Math.round(baseXP * multiplier));

      // 2. Логика SRS (Интервальные повторения)
      // SRS Stage увеличиваем только если это "горячая" тема (плановое повторение).
      // Если рано (isTooEarly) — стадия замирает.
      const intervals = Array.isArray(config.reviewIntervals)
        ? config.reviewIntervals
        : [1, 3, 7, 14, 30];
      const stageBefore = progress.srsStage ?? 0;
      
      const stageAfter = isTooEarly ? stageBefore : stageBefore + 1;

      // Рассчитываем новую дату. 
      // Если рано — оставляем старую дату (не наказываем, но и не продвигаем).
      const nextReviewDate =
        isTooEarly
          ? (progress.nextReviewDate ? new Date(progress.nextReviewDate) : null)
          : stageBefore < intervals.length
            ? this.addDaysAsDate(now, intervals[stageBefore])
            : null;

      const newCurrentXp = (progress.currentXp ?? 0) + xpEarned;
      const newTotalXp = (progress.totalXpEarned ?? 0) + xpEarned;
      const { level, currentLevelMinXp, nextLevelXp } =
        this.computeLevelFromThresholds(newCurrentXp, config.levelThresholds);

      const messageParts: string[] = [];
      
      // Трохи змінимо повідомлення, щоб не плутати користувача
      if (isHotTopic) {
        messageParts.push('✅ Повторення за графіком');
      } else if (dailyTasksCountBefore < config.dailyFullTasks) {
        messageParts.push('🚀 Практика'); // Замість "Занадто рано", якщо це просто грінд
      } else {
        messageParts.push('⏳ Занадто рано');
      }
      
      messageParts.push(`+${xpEarned} XP`);
      if (level > progress.level) {
        messageParts.push(`Рівень ${level} отримано!`);
      }

      // ... збереження (без змін) ...
      
      const xpResult: XPCalculationResult = {
        xpEarned,
        nextReviewDate,
        masteryLevel: level,
        reviewCount: stageAfter,
        message: messageParts.join(' · '),
        isScheduledReview: isHotTopic,
        multiplier,
        dailyTaskIndex,
        isTooEarly,
        isHotTopic,
      };

      await tx.userTaskAttempt.create({
        data: {
          userId,
          taskId,
          topicSlug,
          xpEarned,
          isCorrect: true,
          nextReviewDate,
          reviewCount: stageAfter,
          masteryLevel: level,
        },
      });

      const updated = await tx.userTopicXp.update({
        where: {
          userId_topicSlug: {
            userId,
            topicSlug,
          },
        },
        data: {
          currentXp: newCurrentXp,
          totalXpEarned: newTotalXp,
          level,
          lastActivity: new Date(),
          dailyTasksCount: dailyTasksCountBefore + 1,
          dailyTasksDate: new Date(todayISO),
          srsStage: stageAfter,
          nextReviewDate,
          lastPracticedDate: new Date(todayISO),
        },
      });

      const userXP = this.mapUserTopicXPRow(updated);
      userXP.currentLevelMinXp = currentLevelMinXp;
      userXP.nextLevelXp = nextLevelXp;
      return { xpResult, userXP };
    });
  }

  private static mapUserTaskAttemptRow(row: any): UserTaskAttempt {
    return {
      id: row.id,
      userId: row.userId,
      taskId: row.taskId,
      topicSlug: row.topicSlug,
      completedAt: row.completedAt,
      xpEarned: row.xpEarned,
      isCorrect: row.isCorrect,
      nextReviewDate: row.nextReviewDate,
      reviewCount: row.reviewCount,
      masteryLevel: row.masteryLevel,
    };
  }

  /**
   * Отримати конфігурацію теми з БД
   */
  static async getTopicConfig(
    topicSlug: string,
  ): Promise<TopicXPConfig | null> {
    const row = await prisma.topicXpConfig.findUnique({
      where: { topicSlug },
    });
    return row ? this.mapTopicConfigRow(row) : null;
  }

  /**
   * Отримати досвід користувача по темі
   */
  static async getUserTopicXP(
    userId: string,
    topicSlug: string,
  ): Promise<UserTopicXP | null> {
    const row = await prisma.userTopicXp.findUnique({
      where: {
        userId_topicSlug: {
          userId,
          topicSlug,
        },
      },
    });
    if (!row) return null;

    const userXP = this.mapUserTopicXPRow(row);
    const config = await this.getTopicConfig(topicSlug);
    if (config) {
      const { currentLevelMinXp, nextLevelXp } = this.computeLevelFromThresholds(
        userXP.currentXp,
        config.levelThresholds,
      );
      userXP.currentLevelMinXp = currentLevelMinXp;
      userXP.nextLevelXp = nextLevelXp;
    }
    return userXP;
  }

  /**
   * Отримати всі досвіди користувача
   */
  static async getUserAllTopicsXP(userId: string): Promise<UserTopicXP[]> {
    const rows = await prisma.userTopicXp.findMany({
      where: { userId },
      include: {
        topicConfig: {
          select: {
            topicTitle: true,
            category: true,
          },
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });
    return rows.map((row) => this.mapUserTopicXPRow(row));
  }

  /**
   * Розрахунок досвіду з урахуванням інтервальних повторень
   */
  static async calculateXP(
    userId: string,
    taskId: string,
    topicSlug: string,
    taskBaseXP?: number,
    taskDifficulty?: string,
  ): Promise<XPCalculationResult> {
    // Отримуємо конфігурацію теми
    const config = await this.getTopicConfig(topicSlug);

    if (!config) {
      throw new Error(`Topic config not found for ${topicSlug}`);
    }

    // Перевіряємо попередні спроби
    const lastAttemptRow = await prisma.userTaskAttempt.findFirst({
      where: {
        userId,
        taskId,
        topicSlug,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    const lastAttempt: UserTaskAttempt | null = lastAttemptRow
      ? this.mapUserTaskAttemptRow(lastAttemptRow)
      : null;

    // Calculate base XP based on task properties or config
    let baseXP = config.baseTaskXp;
    if (taskBaseXP !== undefined && taskBaseXP !== null) {
      baseXP = taskBaseXP;
    } else if (taskDifficulty) {
      const diff = taskDifficulty.toLowerCase();
      if (diff === 'easy') baseXP = 100;
      else if (diff === 'medium' || diff === 'moderate') baseXP = 250;
      else if (diff === 'hard') baseXP = 500;
    }

    let xpEarned = baseXP;
    const reviewCount = lastAttempt ? lastAttempt.reviewCount + 1 : 0;
    let masteryLevel = lastAttempt ? lastAttempt.masteryLevel : 0;
    let isScheduledReview = false;

    // Якщо не перша спроба, застосовуємо інтервальні повторення
    if (lastAttempt) {
      const now = new Date();
      const lastCompletedAt = new Date(lastAttempt.completedAt);
      const daysSinceLastAttempt = Math.floor(
        (now.getTime() - lastCompletedAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Перевіряємо, чи це заплановане повторення
      if (
        lastAttempt.nextReviewDate &&
        new Date(lastAttempt.nextReviewDate) <= now
      ) {
        // Повний досвід за заплановане повторення
        isScheduledReview = true;
        xpEarned = baseXP;
        masteryLevel = Math.min(5, masteryLevel + 1);
      } else {
        // Зменшений досвід за передчасне повторення або пізнє
        const decayFactor = Math.pow(config.dailyXpDecay, daysSinceLastAttempt);
        const minXp = baseXP * config.minXpPercent;
        xpEarned = Math.max(minXp, Math.round(baseXP * decayFactor));
      }
    } else {
      // Перша спроба
      masteryLevel = 1;
      xpEarned = baseXP;
    }

    // Визначаємо наступну дату повторення
    const nextReviewDate = this.getNextReviewDate(
      reviewCount,
      config.reviewIntervals,
    );

    const now = new Date();
    const isHotTopic = !lastAttempt?.nextReviewDate || new Date(lastAttempt.nextReviewDate) <= now;
    const isTooEarly = !!lastAttempt?.nextReviewDate && new Date(lastAttempt.nextReviewDate) > now;
    const multiplier = isTooEarly ? config.multiplierEarly : 1.0;
    const dailyTaskIndex = 1; // This method doesn't track daily tasks, so default to 1

    return {
      xpEarned: Math.round(xpEarned),
      nextReviewDate,
      masteryLevel,
      reviewCount,
      message: this.getXPMessage(
        !lastAttempt,
        masteryLevel,
        xpEarned,
        isScheduledReview,
      ),
      isScheduledReview,
      multiplier,
      dailyTaskIndex,
      isTooEarly,
      isHotTopic,
    };
  }

  /**
   * Визначення наступної дати повторення
   */
  private static getNextReviewDate(
    reviewCount: number,
    intervals: number[],
  ): Date | null {
    if (!Array.isArray(intervals) || intervals.length === 0) {
      return null;
    }

    if (reviewCount >= intervals.length) {
      return null; // Тема повністю засвоєна
    }

    const daysToAdd = intervals[reviewCount];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    nextDate.setHours(0, 0, 0, 0); // Початок дня
    return nextDate;
  }

  /**
   * Повідомлення для користувача
   */
  private static getXPMessage(
    isFirstAttempt: boolean,
    masteryLevel: number,
    xpEarned: number,
    isScheduledReview: boolean,
  ): string {
    if (isFirstAttempt) {
      return `🎉 Перша спроба! +${xpEarned} XP`;
    }

    if (masteryLevel >= 5) {
      return `🏆 Тема повністю засвоєна! +${xpEarned} XP`;
    }

    if (isScheduledReview) {
      return `✅ Відмінно! Повторення пройдено. +${xpEarned} XP`;
    }

    return `📚 Повторення зараховано. +${xpEarned} XP`;
  }

  /**
   * Зберегти результат виконання завдання
   */
  static async saveTaskAttempt(
    userId: string,
    taskId: string,
    topicSlug: string,
    xpResult: XPCalculationResult,
    isCorrect: boolean,
  ): Promise<{ userXP: UserTopicXP }> {
    return await prisma.$transaction(async (tx) => {
      const configRow = await tx.topicXpConfig.findUnique({
        where: { topicSlug },
      });
      if (!configRow) {
        throw new Error(`Topic config not found for ${topicSlug}`);
      }
      const config = this.mapTopicConfigRow(configRow);

      // Зберігаємо спробу
      await tx.userTaskAttempt.create({
        data: {
          userId,
          taskId,
          topicSlug,
          xpEarned: xpResult.xpEarned,
          isCorrect,
          nextReviewDate: xpResult.nextReviewDate,
          reviewCount: xpResult.reviewCount,
          masteryLevel: xpResult.masteryLevel,
        },
      });

      // Оновлюємо або створюємо досвід користувача
      const existing = await tx.userTopicXp.findUnique({
        where: {
          userId_topicSlug: {
            userId,
            topicSlug,
          },
        },
      });

      const newCurrentXp = (existing?.currentXp ?? 0) + xpResult.xpEarned;
      const newTotalXp = (existing?.totalXpEarned ?? 0) + xpResult.xpEarned;
      const { level: newLevel } = this.computeLevelFromThresholds(
        newCurrentXp,
        config.levelThresholds,
      );

      const xpUpdateResult = await tx.userTopicXp.upsert({
        where: {
          userId_topicSlug: {
            userId,
            topicSlug,
          },
        },
        create: {
          userId,
          topicSlug,
          currentXp: xpResult.xpEarned,
          totalXpEarned: xpResult.xpEarned,
          level: newLevel,
          lastActivity: new Date(),
        },
        update: {
          currentXp: newCurrentXp,
          totalXpEarned: newTotalXp,
          level: newLevel,
          lastActivity: new Date(),
        },
      });

      return { userXP: this.mapUserTopicXPRow(xpUpdateResult) };
    });
  }

  /**
   * Отримати завдання для повторення
   */
  static async getTasksDueForReview(
    userId: string,
    topicSlug: string,
  ): Promise<TaskDueForReview[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get distinct task IDs that are due for review
    const taskIds = await prisma.userTaskAttempt.findMany({
      where: {
        userId,
        topicSlug,
        nextReviewDate: {
          lte: today,
        },
        masteryLevel: {
          lt: 5,
        },
        isCorrect: true,
      },
      select: {
        taskId: true,
      },
      distinct: ['taskId'],
    });

    // For each task ID, get the most recent attempt
    const attempts = await Promise.all(
      taskIds.map(async ({ taskId }) => {
        const attempt = await prisma.userTaskAttempt.findFirst({
          where: {
            userId,
            topicSlug,
            taskId,
            nextReviewDate: {
              lte: today,
            },
            masteryLevel: {
              lt: 5,
            },
            isCorrect: true,
          },
          orderBy: {
            completedAt: 'desc',
          },
          select: {
            taskId: true,
            nextReviewDate: true,
            masteryLevel: true,
            reviewCount: true,
          },
        });
        return attempt;
      }),
    );

    return attempts
      .filter((attempt): attempt is NonNullable<typeof attempt> => attempt !== null && attempt.nextReviewDate !== null)
      .map((row) => ({
        taskId: row.taskId,
        nextReviewDate: row.nextReviewDate!,
        masteryLevel: row.masteryLevel,
        reviewCount: row.reviewCount,
      }));
  }

  /**
   * Отримати статистику по темі для користувача
   */
  static async getTopicStats(userId: string, topicSlug: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [completedTasks, masteredTasks, avgMastery, tasksDue] = await Promise.all([
      prisma.userTaskAttempt.groupBy({
        by: ['taskId'],
        where: {
          userId,
          topicSlug,
          isCorrect: true,
        },
      }).then((result) => result.length),
      prisma.userTaskAttempt.count({
        where: {
          userId,
          topicSlug,
          isCorrect: true,
          masteryLevel: {
            gte: 5,
          },
        },
      }),
      prisma.userTaskAttempt.aggregate({
        where: {
          userId,
          topicSlug,
          isCorrect: true,
        },
        _avg: {
          masteryLevel: true,
        },
      }).then((result) => result._avg.masteryLevel ?? 0),
      prisma.userTaskAttempt.count({
        where: {
          userId,
          topicSlug,
          isCorrect: true,
          nextReviewDate: {
            lte: today,
          },
          masteryLevel: {
            lt: 5,
          },
        },
      }),
    ]);

    return {
      completed_tasks: completedTasks,
      mastered_tasks: masteredTasks,
      avg_mastery: avgMastery,
      tasks_due: tasksDue,
    };
  }

  /**
   * Отримати історію спроб по завданню
   */
  static async getTaskHistory(
    userId: string,
    taskId: string,
    topicSlug: string,
  ): Promise<UserTaskAttempt[]> {
    const attempts = await prisma.userTaskAttempt.findMany({
      where: {
        userId,
        taskId,
        topicSlug,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
    return attempts.map((row) => this.mapUserTaskAttemptRow(row));
  }

  /**
   * Отримати список ID задач, які користувач виконав правильно
   * Якщо тему час повторювати (isHotTopic), повертає порожній список,
   * щоб усі задачі стали доступними для повторення.
   */
  static async getCompletedTaskIds(
    userId: string,
    topicSlug: string,
  ): Promise<string[]> {
    const userXP = await this.getUserTopicXP(userId, topicSlug);
    if (!userXP) return [];

    const now = new Date();
    const todayISO = this.toISODateString(now);
    const nextReviewISO = userXP.nextReviewDate
      ? this.toISODateString(new Date(userXP.nextReviewDate))
      : null;

    const isHotTopic = !nextReviewISO || nextReviewISO <= todayISO;

    // Якщо прийшов час повторення — всі задачі доступні
    if (isHotTopic) {
      return [];
    }

    // Якщо ще занадто рано для повторення всієї теми — 
    // повертаємо ID задач, які вже були виконані правильно
    const attempts = await prisma.userTaskAttempt.findMany({
      where: {
        userId,
        topicSlug,
        isCorrect: true,
      },
      select: {
        taskId: true,
      },
      distinct: ['taskId'],
    });
    return attempts.map((attempt) => attempt.taskId);
  }
}
