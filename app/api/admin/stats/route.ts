import { NextResponse } from 'next/server';
import { isKvConfigured } from '@/lib/kv';
import { getAdminSteamIds } from '@/lib/admin';

export async function GET() {
  const kvConfigured = isKvConfigured();
  const adminIds = getAdminSteamIds();

  const stats = {
    system: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV,
    },
    kv: {
      configured: kvConfigured,
      url: kvConfigured ? '***configured***' : 'not configured',
    },
    environment: {
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      STEAM_API_KEY: !!process.env.STEAM_API_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      CRON_SECRET: !!process.env.CRON_SECRET,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'not set',
      ADMIN_STEAM_IDS: adminIds.length,
    },
    cache: {
      heroStats: 'dota:cache:hero-stats',
      newsLatest: 'dota:cache:news:latest',
      proLeaderboard: 'dota:cache:pro-leaderboard',
    },
  };

  return NextResponse.json(stats);
}
