import { NextRequest } from 'next/server';
import { getLatestDotaNews } from '@/lib/dotaNews';
import { isKvConfigured } from '@/lib/kv';

/**
 * API для новостного блока
 * 
 * Возвращает свежие новости, собранные "News Bot'ом".
 * Кэшируется на стороне Next.js.
 * 
 * Для максимальной пассивности можно настроить Vercel Cron,
 * который будет регулярно вызывать этот эндпоинт (прогрев кэша).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === '1';

  try {
    const news = await getLatestDotaNews(6, forceRefresh);

    return Response.json({
      success: true,
      updatedAt: new Date().toISOString(),
      count: news.length,
      items: news,
      source: forceRefresh ? 'forced-refresh' : 'cached',
      kv: isKvConfigured(),
    }, {
      headers: {
        'Cache-Control': forceRefresh 
          ? 'no-store' 
          : 'public, s-maxage=10800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('News API error:', error);
    return Response.json(
      { success: false, error: 'Не удалось загрузить новости' },
      { status: 500 }
    );
  }
}
