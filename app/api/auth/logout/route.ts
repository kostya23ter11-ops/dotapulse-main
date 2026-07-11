import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getBaseUrl } from '@/lib/getBaseUrl';

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

async function handleLogout(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  const baseUrl = getBaseUrl(request);
  return Response.redirect(`${baseUrl}/`);
}
