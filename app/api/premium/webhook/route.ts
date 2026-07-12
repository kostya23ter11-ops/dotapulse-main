import { NextRequest } from 'next/server';
import { setPremiumStatus, removePremiumStatus, PREMIUM_DURATION_MS } from '@/lib/premium';

const YOOKASSA_SECRET_KEY = (process.env.YOOKASSA_SECRET_KEY || '').replace(/["']/g, '').trim();
const YOOKASSA_WEBHOOK_SECRET = (process.env.YOOKASSA_WEBHOOK_SECRET || '').replace(/["']/g, '').trim();

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature if secret is configured
    if (YOOKASSA_WEBHOOK_SECRET) {
      const signature = req.headers.get('X-Shop-Signature');
      if (!signature) {
        return Response.json({ error: 'Missing signature' }, { status: 401 });
      }

      const body = await req.text();
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', YOOKASSA_WEBHOOK_SECRET);
      hmac.update(body);
      const expectedSignature = hmac.digest('hex');

      if (signature !== expectedSignature) {
        console.error('[YooKassa] Invalid webhook signature');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = await req.json();
    const type = event.type;
    const payment = event.object;

    if (!payment?.metadata?.steamId) {
      return Response.json({ error: 'No steamId in metadata' }, { status: 400 });
    }

    const steamId = payment.metadata.steamId;

    switch (type) {
      case 'payment.succeeded': {
        const expiresAt = Date.now() + PREMIUM_DURATION_MS;
        await setPremiumStatus(steamId, {
          plan: 'pro',
          expiresAt,
          paymentId: payment.id,
          createdAt: Date.now(),
        });
        console.log(`[Premium] Activated for ${steamId}, expires ${new Date(expiresAt).toISOString()}`);
        break;
      }

      case 'payment.canceled':
      case 'payment.refunded': {
        await removePremiumStatus(steamId);
        console.log(`[Premium] Removed for ${steamId} (${type})`);
        break;
      }

      default:
        // Ignore other events
        break;
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[Premium] Webhook error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
