import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getBaseUrl } from '@/lib/getBaseUrl';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  const baseUrl = getBaseUrl(request);
  return Response.redirect(`${baseUrl}/`);
}
