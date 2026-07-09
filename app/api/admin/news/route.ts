import { NextRequest, NextResponse } from 'next/server';
import { getLatestDotaNews } from '@/lib/dotaNews';

export async function POST(request: NextRequest) {
  try {
    const news = await getLatestDotaNews(6, true);

    return NextResponse.json({
      success: true,
      message: 'News refreshed successfully',
      count: news.length,
      items: news,
    });
  } catch (error) {
    console.error('News refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh news' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const news = await getLatestDotaNews(6, false);

    return NextResponse.json({
      success: true,
      count: news.length,
      items: news,
    });
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
