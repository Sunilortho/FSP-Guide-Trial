import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebaseAdmin';
import { Resend } from 'resend';


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

        const customerEmail = session.customer_details?.email || session.metadata?.email;
        if (customerEmail && process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);

          // ─── DAY 0: Welcome Email ───────────────────────────────────────
          try {
            await resend.emails.send({
              from: 'FSP Guide <onboarding@resend.dev>',
              to: customerEmail,
              subject: 'Willkommen zum FSP Guide – Zugang freigeschaltet! 🎉',
              html: `
                <div style="font-family:sans-serif;color:#111827;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;">
                  <h2 style="color:#00B4D8;text-align:center;">Willkommen beim FSP Guide!</h2>
                  <p>Vielen Dank für deine Zahlung. Dein lebenslanger Vollzugang ist jetzt offiziell freigeschaltet! 🚀</p>
                  <p><strong>Dein 3-Schritte Schnellstart:</strong></p>
                  <ol style="padding-left:20px;">
                    <li style="margin-bottom:8px;"><strong>Schritt 1:</strong> Lade ein Profilbild hoch (+20 XP)</li>
                    <li style="margin-bottom:8px;"><strong>Schritt 2:</strong> Starte deine erste FSP-Simulation mit einem KI-Patienten</li>
                    <li style="margin-bottom:8px;"><strong>Schritt 3:</strong> Lerne 10 medizinische Begriffe mit Audio-Aussprache</li>
                  </ol>
                  <p style="text-align:center;margin:30px 0;">
                    <a href="https://fsp-guide-for-busy-professionals-fawn.vercel.app/" style="background-color:#00B4D8;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Jetzt loslegen →</a>
                  </p>
                  <p style="color:#6B7280;font-size:13px;">Tipp: Öffne den KI-Assistenten unten rechts für sofortige Lernhilfe.</p>
                  <p>Viel Erfolg! 💪<br/><em>Dein FSP Guide Team</em></p>
                </div>
              `
            });
            console.log(`📧 Welcome email sent to ${customerEmail}`);
          } catch (e) {
            console.error('Welcome email failed:', e);
          }

          // ─── DAY 3: Follow-up drip ──────────────────────────────────────
          try {
            const day3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
            await resend.emails.send({
              from: 'FSP Guide <onboarding@resend.dev>',
              to: customerEmail,
              subject: 'Tag 3 – Wie läuft deine Vorbereitung? 🔥',
              scheduledAt: day3,
              html: `
                <div style="font-family:sans-serif;color:#111827;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;">
                  <h2 style="color:#00B4D8;">Tag 3 deiner FSP-Vorbereitung</h2>
                  <p>Hallo!</p>
                  <p>Du hast vor 3 Tagen deinen Vollzugang freigeschaltet. Wie läuft es?</p>
                  <p>Falls du noch nicht gestartet bist — kein Problem! Hier sind 2 schnelle Dinge, die du heute in 15 Minuten erledigen kannst:</p>
                  <ul style="padding-left:20px;">
                    <li style="margin-bottom:8px;">✅ <strong>1 FSP-Simulation</strong> mit einem KI-Patienten durchführen</li>
                    <li style="margin-bottom:8px;">✅ <strong>10 Begriffe</strong> mit Audio durchgehen</li>
                  </ul>
                  <p>Konsistenz schlägt Intensität — 15 Minuten täglich reichen, um die FSP zu bestehen.</p>
                  <p style="text-align:center;margin:30px 0;">
                    <a href="https://fsp-guide-for-busy-professionals-fawn.vercel.app/simulator" style="background-color:#111827;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Simulation starten →</a>
                  </p>
                  <p>Du schaffst das! 🏆<br/><em>Dein FSP Guide Team</em></p>
                </div>
              `
            });
            console.log(`📧 Day-3 drip scheduled for ${customerEmail}`);
          } catch (e) {
            console.error('Day-3 drip email failed:', e);
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
