import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  let event;
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }
    event = stripe.webhooks.constructEvent(
      payload,
      signature as string,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.client_reference_id || session.metadata?.userId;

    if (userId && adminDb) {
      try {
        await adminDb.collection('users').doc(userId).update({
          isPaid: true,
          updatedAt: new Date()
        });
        console.log(`Successfully upgraded user ${userId} to Paid access.`);
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    } else if (!adminDb) {
      console.error('adminDb is not initialized, check FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  }

  return NextResponse.json({ received: true });
}
