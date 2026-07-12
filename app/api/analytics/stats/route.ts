import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { kvGet, kvIncr } from '@/lib/kv';

const TOTAL_KEY = 'analytics:total:visitors';
const TOTAL_VIEWS_KEY = 'analytics:total:views';

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getHourKey(daysAgo: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString().slice(0, 13);
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin
    const token = req.cookies.get('auth_token')?.value;
    if (!token || !process.env.AUTH_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get totals
    const totalVisitors = (await kvGet<number>(TOTAL_KEY)) || 0;
    const totalViews = (await kvGet<number>(TOTAL_VIEWS_KEY)) || 0;

    // Get today's stats
    const today = getToday();
    const todayVisitors = await kvGet<Record<string, boolean>>(`analytics:visitors:${today}`);
    const todayUniqueVisitors = todayVisitors ? Object.keys(todayVisitors).length : 0;
    const todayViews = (await kvGet<number>(`analytics:daily:${today}`)) || 0;

    // Get hourly data for today (last 24 hours)
    const hourlyData: { hour: string; views: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const hourKey = getHourKey(0, 23 - i);
      const views = (await kvGet<number>(`analytics:hourly:${hourKey}`)) || 0;
      hourlyData.push({
        hour: hourKey.slice(11, 13) + ':00',
        views,
      });
    }

    // Get daily data for last 7 days
    const dailyData: { date: string; views: number; visitors: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = getDateDaysAgo(i);
      const views = (await kvGet<number>(`analytics:daily:${date}`)) || 0;
      const visitors = await kvGet<Record<string, boolean>>(`analytics:visitors:${date}`);
      dailyData.push({
        date,
        views,
        visitors: visitors ? Object.keys(visitors).length : 0,
      });
    }

    // Get top paths
    const topPaths: { path: string; views: number }[] = [];
    const commonPaths = ['/', '/builds', '/meta', '/leaderboard', '/updates', '/premium', '/settings'];
    for (const path of commonPaths) {
      const views = (await kvGet<number>(`analytics:path:${path}`)) || 0;
      if (views > 0) {
        topPaths.push({ path, views });
      }
    }
    topPaths.sort((a, b) => b.views - a.views);

    return Response.json({
      totals: {
        visitors: totalVisitors,
        views: totalViews,
      },
      today: {
        visitors: todayUniqueVisitors,
        views: todayViews,
      },
      hourly: hourlyData,
      daily: dailyData,
      topPaths: topPaths.slice(0, 10),
    });
  } catch (error) {
    console.error('[Analytics] Stats error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
