import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { Resend } from 'resend';



export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'E-Mail-Adresse fehlt.' }, { status: 400 });
    }

    if (!adminAuth) {
      console.error('adminAuth is not initialized.');
      return NextResponse.json({ error: 'Server-Konfigurationsfehler.' }, { status: 500 });
    }

    try {
      // 1. Generate the reset link using Firebase Admin SDK
      const resetLink = await adminAuth.generatePasswordResetLink(email);

      // 2. Send the link via Resend
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const res = await resend.emails.send({
          from: 'Medicortex <noreply@send.medicortex.de>',
          to: email,
          subject: 'Passwort zurücksetzen – FSP Guide 🔐',
          html: `
            <div style="font-family:sans-serif;color:#111827;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#00B4D8;text-align:center;">Passwort zurücksetzen</h2>
              <p>Hallo,</p>
              <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für den FSP Guide gestellt. Klicken Sie auf den untenstehenden Button, um ein neues Passwort zu wählen:</p>
              <p style="text-align:center;margin:30px 0;">
                <a href="${resetLink}" style="background-color:#111827;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Neues Passwort festlegen →</a>
              </p>
              <p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail einfach ignorieren. Ihr Passwort wird nicht geändert, solange Sie nicht auf den Link klicken.</p>
              <p style="color:#6B7280;font-size:13px;margin-top:20px;border-top:1px solid #E5E7EB;padding-top:10px;">
                Dieser Link ist nur für begrenzte Zeit gültig.
              </p>
              <p>Viel Erfolg bei der Vorbereitung!<br/><em>Dein FSP Guide Team</em></p>
            </div>
          `
        });
        
        if (res.error) {
          console.error('Resend API Error:', res.error);
          return NextResponse.json({ error: 'Resend Fehler: ' + res.error.message }, { status: 500 });
        }
        
        console.log(`📧 Reliable password reset email sent to ${email} via Resend. ID: ${res.data?.id}`);
      } else {
        throw new Error('RESEND_API_KEY is missing');
      }

      const responseData: any = { success: true };
      // Only return the link in development for debugging
      if (process.env.NODE_ENV === 'development') {
        responseData.debugLink = resetLink;
      }

      return NextResponse.json(responseData);
    } catch (error: any) {
      console.error('Error generating reset link or sending email:', error);
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'Diese E-Mail-Adresse ist nicht registriert.' }, { status: 404 });
      }
      
      const errorResponse: any = { 
        error: 'Fehler: ' + (error.message || 'Unbekannter Fehler'),
        details: error.stack // Add stack trace temporarily for debugging
      };
      if (error.message && error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
         errorResponse.error = 'Firebase Admin Service Account Key is missing or invalid on Vercel.';
      }
      if (error.name === 'FirebaseError') {
         errorResponse.error = `Firebase Error: ${error.code} - ${error.message}`;
      }
      
      return NextResponse.json(errorResponse, { status: 500 });
    }
  } catch (error) {
    console.error('Invalid request:', error);
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }
}
