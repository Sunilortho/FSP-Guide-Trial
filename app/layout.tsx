import type {Metadata} from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import AIAssistant from '@/components/AIAssistant';
import { cookies } from 'next/headers';

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
      <body suppressHydrationWarning className="font-sans">
        {children}
        {showAIAssistant && <AIAssistant />}
      </body>
    </html>
  );
}
