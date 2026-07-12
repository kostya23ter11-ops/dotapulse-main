import { NextRequest } from 'next/server';
import { kvGet, kvSet, kvIncr } from '@/lib/kv';

interface PageView {
  path: string;
  referrer?: string;
  userAgent?: string;
}

const HOUR_TTL = 86400 * 7; // 7 days
const DAY_TTL = 86400 * 90; // 90 days
const TOTAL_KEY = 'analytics:total:visitors';
const TOTAL_VIEWS_KEY = 'analytics:total:views';

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentHour(): string {
  const now = new Date();
  return `${now.toISOString().slice(0, 10)}T${String(now.getHours()).padStart(2, '0')}`;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0].trim() : null) || 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, userAgent } = body as PageView;

    if (!path) {
      return Response.json({ error: 'path required' }, { status: 400 });
    }

    const ip = getClientIp(req);
    const today = getToday();
    const currentHour = getCurrentHour();

    // Track unique visitors per day
    const visitorsKey = `analytics:visitors:${today}`;
    const existingVisitors = await kvGet<Record<string, boolean>>(visitorsKey) || {};
    const isNewVisitor = !existingVisitors[ip];
    existingVisitors[ip] = true;
    await kvSet(visitorsKey, existingVisitors, DAY_TTL);

    // Increment total visitors if new
    if (isNewVisitor) {
      await kvIncr(TOTAL_KEY, DAY_TTL * 2);
    }

    // Increment total page views
    await kvIncr(TOTAL_VIEWS_KEY, DAY_TTL * 2);

    // Increment hourly page views
    await kvIncr(`analytics:hourly:${currentHour}`, HOUR_TTL);

    // Increment daily page views
    await kvIncr(`analytics:daily:${today}`, DAY_TTL);

    // Track path popularity
    await kvIncr(`analytics:path:${path}`, HOUR_TTL);

    return Response.json({ ok: true });
  } catch (error) {
    // Silently fail - analytics shouldn't break the site
    return Response.json({ ok: true });
  }
}
