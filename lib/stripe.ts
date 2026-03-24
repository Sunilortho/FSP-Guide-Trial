import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    
    // During build time on Vercel, some environment variables might be missing.
    // We don't want to crash the entire build if Stripe is not immediately needed.
    if (!key) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ STRIPE_SECRET_KEY is missing. Stripe features will fail at runtime.');
        // Return a dummy instance or handle it gracefully. 
        // For now, we still throw but only when called, but let's be even safer:
        return new Proxy({} as Stripe, {
          get() {
            throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your Vercel Environment Variables.');
          }
        });
      }
      throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your environment variables.');
    }

    _stripe = new Stripe(key, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return _stripe;
}

// Keep backward compat export (lazy getter)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const s = getStripe();
    return (s as any)[prop];
  },
});
