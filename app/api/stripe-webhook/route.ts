import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId && adminDb) {
      try {
        await adminDb.collection('users').doc(userId).set(
          { hasPaid: true, paidAt: new Date().toISOString() },
          { merge: true }
        );
        console.log(`✅ User ${userId} marked as paid.`);
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    } else if (!adminDb) {
      console.error('adminDb not initialized. Check FIREBASE_SERVICE_ACCOUNT_KEY.');
    }
  }

  return NextResponse.json({ received: true });
}
