import { NextRequest } from 'next/server';
import { getLatestDotaNews } from '@/lib/dotaNews';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET is not set — endpoint disabled');
    return Response.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const news = await getLatestDotaNews(6, true);

    return Response.json({
      success: true,
      message: 'News feed refreshed by bot',
      count: news.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[News Bot] Cron refresh failed:', error);
    return Response.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
