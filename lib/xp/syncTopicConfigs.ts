import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { TopicConfig } from '@/types/xp';

/**
 * Синхронізація всіх config.json файлів з базою даних
 * Викликається при старті додатку або вручну
 */
export async function syncTopicConfigs() {
  try {
    const contentDir = join(process.cwd(), 'content', 'math');
    const entries = await readdir(contentDir, { withFileTypes: true });
    const topics = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    const syncResults = [];

    for (const topicSlug of topics) {
      const configPath = join(contentDir, topicSlug, 'config.json');

      try {
        const configFile = await readFile(configPath, 'utf-8');
        const config: TopicConfig = JSON.parse(configFile);

        // Синхронізуємо з БД
        const result = await syncTopicConfig(config);
        syncResults.push({ topicSlug, success: true, result });
      } catch (error: any) {
        syncResults.push({
          topicSlug,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      synced: syncResults.filter((r) => r.success).length,
      total: syncResults.length,
      results: syncResults,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Синхронізація конкретної теми з базою даних
 */
export async function syncTopicConfig(config: TopicConfig) {
  try {
    // Build create/update data with only defined optional fields
    const createData: any = {
      topicSlug: config.slug,
      topicTitle: config.title,
      category: config.category,
      description: config.description || null,
      difficulty: config.difficulty || null,
      maxXp: config.maxXp,
      baseTaskXp: config.baseTaskXp,
      dailyXpDecay: config.dailyXpDecay,
      minXpPercent: config.minXpPercent,
      reviewIntervals: config.reviewIntervals,
      tags: config.tags || [],
    };

    const updateData: any = {
      topicTitle: config.title,
      category: config.category,
      description: config.description || null,
      difficulty: config.difficulty || null,
      maxXp: config.maxXp,
      baseTaskXp: config.baseTaskXp,
      dailyXpDecay: config.dailyXpDecay,
      minXpPercent: config.minXpPercent,
      reviewIntervals: config.reviewIntervals,
      tags: config.tags || [],
      updatedAt: new Date(),
    };

    // Add optional fields only if they are defined
    if (config.dailyFullTasks !== undefined) {
      createData.dailyFullTasks = config.dailyFullTasks;
      updateData.dailyFullTasks = config.dailyFullTasks;
    }
    if (config.dailyHalfTasks !== undefined) {
      createData.dailyHalfTasks = config.dailyHalfTasks;
      updateData.dailyHalfTasks = config.dailyHalfTasks;
    }
    if (config.multiplierFull !== undefined) {
      createData.multiplierFull = config.multiplierFull;
      updateData.multiplierFull = config.multiplierFull;
    }
    if (config.multiplierHalf !== undefined) {
      createData.multiplierHalf = config.multiplierHalf;
      updateData.multiplierHalf = config.multiplierHalf;
    }
    if (config.multiplierLow !== undefined) {
      createData.multiplierLow = config.multiplierLow;
      updateData.multiplierLow = config.multiplierLow;
    }
    if (config.multiplierEarly !== undefined) {
      createData.multiplierEarly = config.multiplierEarly;
      updateData.multiplierEarly = config.multiplierEarly;
    }
    if (config.levelThresholds !== undefined) {
      createData.levelThresholds = config.levelThresholds;
      updateData.levelThresholds = config.levelThresholds;
    }

    const result = await prisma.topicXpConfig.upsert({
      where: {
        topicSlug: config.slug,
      },
      create: createData,
      update: updateData,
    });

    return result;
  } catch (error: any) {
    // Re-throw with more context
    throw new Error(
      `Failed to sync topic config for ${config.slug}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Отримати конфігурацію теми з файлу
 */
export async function loadTopicConfig(
  topicSlug: string,
): Promise<TopicConfig | null> {
  try {
    const configPath = join(
      process.cwd(),
      'content',
      'math',
      topicSlug,
      'config.json',
    );
    const configFile = await readFile(configPath, 'utf-8');
    return JSON.parse(configFile);
  } catch (error) {
    console.error(`Failed to load config for ${topicSlug}:`, error);
    return null;
  }
}

/**
 * Отримати всі конфігурації тем
 */
export async function loadAllTopicConfigs(): Promise<TopicConfig[]> {
  try {
    const contentDir = join(process.cwd(), 'content', 'math');
    const topics = await readdir(contentDir);

    const configs = await Promise.all(
      topics.map(async (topicSlug) => {
        return loadTopicConfig(topicSlug);
      }),
    );

    return configs.filter((config): config is TopicConfig => config !== null);
  } catch (error) {
    console.error('Failed to load topic configs:', error);
    return [];
  }
}
