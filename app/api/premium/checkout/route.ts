import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { PREMIUM_PRICE, PREMIUM_CURRENCY } from '@/lib/premium';

const YOOKASSA_SHOP_ID = (process.env.YOOKASSA_SHOP_ID || '').replace(/["']/g, '').trim();
const YOOKASSA_SECRET_KEY = (process.env.YOOKASSA_SECRET_KEY || '').replace(/["']/g, '').trim();

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.AUTH_SECRET) {
      return Response.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const steamId = payload.steamId as string;

    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      return Response.json({ error: 'Payment system not configured' }, { status: 500 });
    }

    const baseUrl = getBaseUrl(req);
    const idempotencyKey = `premium-${steamId}-${Date.now()}`;

    const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amount: {
          value: PREMIUM_PRICE,
          currency: PREMIUM_CURRENCY,
        },
        confirmation: {
          type: 'redirect',
          return_url: `${baseUrl}/premium/success`,
        },
        capture: true,
        description: 'PULSE PRO — ежемесячная подписка',
        metadata: {
          steamId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[YooKassa] Create payment failed:', response.status, error);
      return Response.json({ error: 'Payment creation failed' }, { status: 500 });
    }

    const payment = await response.json();
    return Response.json({
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
    });
  } catch (error) {
    console.error('[Premium] Checkout error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
