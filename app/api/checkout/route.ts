import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    const priceAmount = parseInt(process.env.STRIPE_PRICE_AMOUNT || '49900'); // Default to 499.00 EUR
    const currency = process.env.STRIPE_CURRENCY || 'eur';

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'FSP Guide Vollversion',
              description: 'Lebenslanger unbegrenzter Zugang zu allen KI-Simulatoren und Lernmaterialien.',
            },
            unit_amount: priceAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // The webhook needs to know who paid
      client_reference_id: userId,
      metadata: {
        userId,
      },
      // Ensure these point to your deployed URL in prod or localhost in dev
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?canceled=true`,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create Stripe checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: err.statusCode || 500 }
    );
  }
}
