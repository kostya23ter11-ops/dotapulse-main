import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Защищаем только /admin маршруты
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const secret = process.env.AUTH_SECRET;
      if (!secret) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );

      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Защищаем API админки
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const secret = process.env.AUTH_SECRET;
      if (!secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );

      if (payload.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/premium/:path*'],
};
