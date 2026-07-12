import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getPremiumStatus } from '@/lib/premium';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return Response.json({ premium: false });
    }

    if (!process.env.AUTH_SECRET) {
      return Response.json({ premium: false });
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const steamId = payload.steamId as string;

    const status = await getPremiumStatus(steamId);

    return Response.json({
      premium: !!status,
      expiresAt: status?.expiresAt,
      plan: status?.plan,
    });
  } catch {
    return Response.json({ premium: false });
  }
}
