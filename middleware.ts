import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/', // Allow home page for auth check
  '/payment',
  '/api/stripe-webhook',
  '/api/create-checkout-session',
  '/payment-success',
  '/_next',
  '/favicon.ico',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log('⚙️ MIDDLEWARE HIT:', pathname);

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ADMIN BYPASS: if cookie matches admin token, allow through
  const adminToken = req.cookies.get('admin_bypass')?.value;
  if (process.env.ADMIN_BYPASS_TOKEN && adminToken === process.env.ADMIN_BYPASS_TOKEN) {
    return NextResponse.next();
  }

  // Check payment status via cookie set after successful payment
  const hasPaid = req.cookies.get('user_paid')?.value;
  if (hasPaid === 'true') {
    return NextResponse.next();
  }

  // Redirect all others to payment page
  return NextResponse.redirect(new URL('/payment', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
