import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return Response.json({ user: null });
  }

  try {
    if (!process.env.AUTH_SECRET) {
      return Response.json({ user: null });
    }
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return Response.json({ user: payload });
  } catch (error) {
    return Response.json({ user: null });
  }
}
