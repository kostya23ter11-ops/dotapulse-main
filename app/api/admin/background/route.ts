import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvSet } from '@/lib/kv';

const BACKGROUND_KEY = 'site:background';
const DEFAULT_BACKGROUND = '/fon.jpg';

const PRESETS = [
  { id: 'default', name: 'Dota 2', url: '/fon.jpg' },
  { id: 'dark-carnival', name: 'Dark Carnival', url: '/fon-dark-carnival.jpg' },
];

export async function GET() {
  const current = await kvGet<string>(BACKGROUND_KEY);
  return NextResponse.json({
    current: current || DEFAULT_BACKGROUND,
    presets: PRESETS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    await kvSet(BACKGROUND_KEY, url, 365 * 24 * 60 * 60);
    return NextResponse.json({ success: true, current: url });
  } catch {
    return NextResponse.json({ error: 'Failed to update background' }, { status: 500 });
  }
}
