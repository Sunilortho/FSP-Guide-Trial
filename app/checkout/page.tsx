'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, Stethoscope, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleCheckout = async () => {
    if (!user) return;
    setCheckoutLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session', data);
        alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
        setCheckoutLoading(false);
      }
    } catch (err) {
      console.error('Error in checkout:', err);
      alert('Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B4D8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] transition-colors font-medium text-sm">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>
        <div className="flex items-center gap-4">
          <div className="bg-[#00B4D8] p-2 rounded-xl shadow-sm">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111827]">
              FSP Guide for <span className="font-serif italic font-medium">busy professionals</span>
            </h1>
          </div>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] mb-4">
            Bereit für die <span className="text-[#00B4D8]">Vollversion?</span>
          </h2>
          <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
            Schalten Sie den lebenslangen Zugang zu allen KI-Simulatoren und Lernwerkzeugen frei und bestehen Sie Ihre Fachsprachprüfung mit Leichtigkeit.
          </p>
        </div>

        <div className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-xl overflow-hidden max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-[#111827] to-[#1f2937] p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#00B4D8]/20 rounded-full blur-2xl"></div>
            
            <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Premium Zugang</h3>
            <div className="flex justify-center items-end gap-2 text-white relative z-10">
              <span className="text-5xl font-black">€499</span>
              <span className="text-[#9CA3AF] mb-1">/ einmalig</span>
            </div>
            <p className="text-[#9CA3AF] text-sm mt-4 font-medium relative z-10">
              Lebenslanger Zugang. Keine versteckten Gebühren.
            </p>
          </div>

          <div className="p-8 md:p-10">
            <ul className="space-y-4 mb-10">
              {[
                'Unbegrenzter FSP Simulator Zugang (Emotionale KI)',
                'Unbegrenztes Oberarzt-Training (Visite)',
                'Masterclass für 300+ medizinische Begriffe (Flashcards)',
                'Intensive Arztbrief-Korrekturen in Sekunden',
                'Detaillierte Historie & Leistungsanalyse',
                'Zukünftige Updates inklusive'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" />
                  <span className="font-medium text-[#4B5563]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full py-4 px-8 bg-[#00B4D8] hover:bg-[#0077B6] text-white text-lg font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3"
            >
              {checkoutLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Lade Checkout...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-6 h-6" />
                  Jetzt sicher freischalten
                </>
              )}
            </button>
            <p className="text-center text-xs text-[#9CA3AF] mt-4 font-medium flex items-center justify-center gap-1">
              Sichere Zahlung abgewickelt durch Stripe
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
