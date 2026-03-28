import type {Metadata} from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import AIAssistant from '@/components/AIAssistant';
import { cookies } from 'next/headers';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'FSP Guide for busy professionals',
  description: 'High-efficiency FSP exam preparation',
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const cookieStore = await cookies();
  const hasPaid = cookieStore.get('user_paid')?.value === 'true';
  const adminBypass = cookieStore.get('admin_bypass')?.value;
  const isAdmin = process.env.ADMIN_BYPASS_TOKEN && adminBypass === process.env.ADMIN_BYPASS_TOKEN;

  const showAIAssistant = hasPaid || isAdmin;

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Temporarily disabled ReCAPTCHA script for Vercel trial domain 
        <Script 
          src="https://www.google.com/recaptcha/enterprise.js?render=6LeA7JYsAAAAAE6LNsneNwTYJQpzu2GhQbsz8tCy"
          strategy="beforeInteractive"
        />
        */}
      </head>
      <body suppressHydrationWarning className="font-sans">
        {children}
        {showAIAssistant && <AIAssistant />}
        
        {/* ConvoCore Assistant */}
        <Script id="convocore-assistant" strategy="afterInteractive">
          {`
            (function() {
                window.VG_CONFIG = {
                    ID: "VLArdxsOd2U2gEPLZQjk",
                    region: 'eu', 
                    render: 'popup', 
                    stylesheets: [
                        "https://cdn.convocore.ai/vg_live_build/styles.css",
                    ],
                }
                var VG_SCRIPT = document.createElement("script");
                VG_SCRIPT.src = "https://cdn.convocore.ai/vg_live_build/vg_bundle.js";
                VG_SCRIPT.defer = true; 
                document.body.appendChild(VG_SCRIPT);
            })()
          `}
        </Script>
      </body>
    </html>
  );
}
