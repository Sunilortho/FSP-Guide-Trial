'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2, Stethoscope } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Set the user_paid cookie (1 year expiry)
      document.cookie = 'user_paid=true; path=/; max-age=31536000; SameSite=Lax';
      setVerified(true);

      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div className="bg-[#00B4D8] p-2 rounded-xl shadow-sm">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">
          FSP Guide for <span className="font-serif italic font-medium">busy professionals</span>
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-12 shadow-sm">
          <div className="w-20 h-20 bg-[#D1FAE5] rounded-[24px] flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-[#059669]" />
          </div>
          <h2 className="text-3xl font-bold text-[#111827] mb-4">Zahlung erfolgreich!</h2>
          <p className="text-lg text-[#6B7280] mb-8 leading-relaxed">
            Ihr Zugang wurde freigeschaltet. Sie werden in wenigen Sekunden weitergeleitet...
          </p>
          {verified && (
            <div className="inline-flex items-center gap-2 bg-[#D1FAE5] text-[#065F46] text-sm font-bold px-4 py-2 rounded-full border border-[#A7F3D0]">
              <CheckCircle2 className="w-4 h-4" />
              Vollzugang aktiviert
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B4D8]"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
