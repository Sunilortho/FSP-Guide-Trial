'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2, Stethoscope, Play, BookOpen, FileText, UserCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    step: '01',
    icon: UserCheck,
    color: '#00B4D8',
    bg: '#E0F7FC',
    title: 'Profil einrichten',
    desc: 'Lade ein Profilbild hoch und personalisiere deinen Account — verdiene dabei 20 XP.',
    href: '/',
  },
  {
    step: '02',
    icon: Play,
    color: '#6366F1',
    bg: '#EEF2FF',
    title: 'Erste Simulation starten',
    desc: 'Starte deine erste FSP-Simulation mit einem KI-Patienten — kein Druck, kein Zeitlimit.',
    href: '/simulator',
  },
  {
    step: '03',
    icon: BookOpen,
    color: '#10B981',
    bg: '#D1FAE5',
    title: '10 Begriffe lernen',
    desc: 'Beherrsche die häufigsten 10 FSP-Fachbegriffe mit Audio-Aussprache und Beispielsätzen.',
    href: '/begriffe',
  },
];

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      document.cookie = 'user_paid=true; path=/; max-age=31536000; SameSite=Lax';
      setTimeout(() => setVerified(true), 0);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!verified) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push('/');
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [verified, router]);

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

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Success banner */}
        <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-10 shadow-sm text-center mb-8">
          <div className="w-20 h-20 bg-[#D1FAE5] rounded-[24px] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#059669]" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#111827] mb-3">Zahlung erfolgreich! 🎉</h2>
          <p className="text-[#6B7280] mb-5 leading-relaxed">
            Dein lebenslanger Vollzugang ist jetzt aktiv. Willkommen in der FSP-Guide Community!
          </p>
          {verified && (
            <div className="inline-flex items-center gap-2 bg-[#D1FAE5] text-[#065F46] text-sm font-bold px-4 py-2 rounded-full border border-[#A7F3D0] mb-4">
              <CheckCircle2 className="w-4 h-4" />
              Vollzugang aktiviert
            </div>
          )}
          {verified && (
            <p className="text-xs text-[#9CA3AF] font-medium">
              Du wirst in <span className="font-bold text-[#00B4D8]">{countdown}s</span> automatisch weitergeleitet...
            </p>
          )}
        </div>

        {/* 3-step onboarding */}
        <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-5 h-5 text-[#00B4D8]" />
            <h3 className="text-lg font-bold text-[#111827]">Dein 3-Schritte Schnellstart</h3>
          </div>
          <div className="space-y-4">
            {STEPS.map(({ step, icon: Icon, color, bg, title, desc, href }) => (
              <Link
                key={step}
                href={href}
                className="flex items-start gap-4 p-4 rounded-2xl border border-[#E5E7EB] hover:border-[#00B4D8] hover:shadow-md transition-all group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: bg }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">Schritt {step}</span>
                  </div>
                  <p className="font-bold text-[#111827] text-sm">{title}</p>
                  <p className="text-xs text-[#6B7280] leading-relaxed mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#00B4D8] transition-colors shrink-0 mt-1" />
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#111827] text-white text-sm font-bold rounded-2xl hover:bg-black transition-all shadow-lg"
            >
              Jetzt loslegen
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
