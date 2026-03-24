import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebaseAdmin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

        // -------------------------------------------------------------
        // Send a Welcome Email via Resend
        // -------------------------------------------------------------
        const customerEmail = session.customer_details?.email || session.metadata?.email;
        if (customerEmail && process.env.RESEND_API_KEY) {
          try {
            await resend.emails.send({
              from: 'FSP Guide <onboarding@resend.dev>', // Free tier sandbox address
              to: customerEmail,
              subject: 'Willkommen zum FSP Guide – Zugang freigeschaltet! 🎉',
              html: `
                <div style="font-family: sans-serif; color: #111827; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #00B4D8; text-align: center;">Willkommen beim FSP Guide!</h2>
                  <p>Vielen Dank für Ihre Registrierung und Zahlung. Ihr lebenslanger Vollzugang ist nun offiziell freigeschaltet.</p>
                  <p>Sie können ab sofort alle KI-gestützten Premium-Funktionen nutzen:</p>
                  <ul>
                    <li>✓ <strong>Emotionale KI (FSP Simulator):</strong> Trainieren Sie Anamnesegespräche.</li>
                    <li>✓ <strong>Oberarzt-Rollenspiele:</strong> Trainieren Sie die Visite unter Druck.</li>
                    <li>✓ <strong>Arztbrief-Korrektur:</strong> Erhalten Sie blitzschnelles, präzises Feedback.</li>
                  </ul>
                  <p style="text-align: center; margin: 30px 0;">
                    <a href="https://fsp-guide-for-busy-professionals-fawn.vercel.app/" style="background-color: #00B4D8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Plattform Starten</a>
                  </p>
                  <p>Loggen Sie sich ein und öffnen Sie den schwebenden KI-Assistenten unten rechts, um direkt loszulegen.</p>
                  <br/>
                  <p>Viel Erfolg bei Ihrer Vorbereitung!</p>
                  <p><em>Ihr FSP Guide Team</em></p>
                </div>
              `
            });
            console.log(`📧 Welcome email successfully sent to ${customerEmail}`);
          } catch (emailError) {
            console.error('Failed to send welcome email via Resend:', emailError);
          }
        }

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
