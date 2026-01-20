import { NextResponse } from 'next/server';
import { syncTopicConfigs } from '@/lib/xp/syncTopicConfigs';

/**
 * GET /api/sync-topics
 * Синхронізує всі config.json з базою даних
 */
export async function GET() {
  try {
    const result = await syncTopicConfigs();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
