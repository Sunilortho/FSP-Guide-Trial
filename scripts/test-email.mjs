import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Minimal .env parser
const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const RESEND_API_KEY = envContent.match(/RESEND_API_KEY=([^ \n]+)/)?.[1];

const resend = new Resend(RESEND_API_KEY);

async function test() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node scripts/test-email.mjs <your-email>');
    return;
  }

  console.log(`Sending test email to ${email} using key: ${RESEND_API_KEY?.substring(0, 5)}...`);
  try {
    const res = await resend.emails.send({
      from: 'Medicortex <noreply@send.medicortex.de>',
      to: email,
      subject: 'Resend Test – FSP Guide',
      html: '<strong>Resend is working with your subdomain send.medicortex.de!</strong>'
    });

    if (res.error) {
      console.error('❌ Resend Error:', res.error);
    } else {
      console.log('✅ Success! ID:', res.data?.id);
      console.log('Check your inbox (and spam folder).');
    }
  } catch (err) {
    console.error('💥 Crash:', err);
  }
}

test();
