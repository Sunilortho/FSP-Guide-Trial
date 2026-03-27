import { NextResponse } from 'next/server';

const PROJECT_ID = 'perfect-stock-486708-k1';
const SITE_KEY = '6LeA7JYsAAAAAE6LNsneNwTYJQpzu2GhQbsz8tCy';
// Use the API key from config (ideally should be an environment variable in production)
const API_KEY = process.env.GOOGLE_RECAPTCHA_API_KEY || 'AIzaSyBKEt8Lz94ZpTCFdWC_eur1aO7KwD7JCTw';

export async function POST(req: Request) {
  try {
    const { token, action } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 400 });
    }

    const verificationUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${API_KEY}`;

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: {
          token: token,
          siteKey: SITE_KEY,
          expectedAction: action,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('reCAPTCHA verification failed:', result);
      return NextResponse.json({ error: 'Verifizierung fehlgeschlagen', details: result }, { status: 500 });
    }

    // result.riskAnalysis.score typically ranges from 0.0 to 1.0 (1.0 is very likely a human)
    const score = result.riskAnalysis?.score || 0;
    const isHuman = score >= 0.5;

    return NextResponse.json({
      success: isHuman,
      score,
      reasons: result.riskAnalysis?.reasons || [],
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
