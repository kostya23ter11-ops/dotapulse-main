import { NextRequest, NextResponse } from 'next/server';
import { cacheDel } from '@/lib/serverCache';
import { CACHE_KEYS } from '@/lib/serverCache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (key === 'all') {
      await Promise.all([
        cacheDel(CACHE_KEYS.heroStats),
        cacheDel(CACHE_KEYS.newsLatest),
        cacheDel(CACHE_KEYS.proLeaderboard),
      ]);
      return NextResponse.json({
        success: true,
        message: 'All caches cleared',
        cleared: [CACHE_KEYS.heroStats, CACHE_KEYS.newsLatest, CACHE_KEYS.proLeaderboard],
      });
    }

    if (key && typeof key === 'string') {
      await cacheDel(key);
      return NextResponse.json({
        success: true,
        message: `Cache key "${key}" cleared`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid key. Use "all" or a specific cache key.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
