'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { RecaptchaVerifier, linkWithPhoneNumber } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Shield, Smartphone, ArrowRight, X } from 'lucide-react';

interface PhoneVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function PhoneVerifyModal({ isOpen, onClose, onSuccess, userId }: PhoneVerifyModalProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && !(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      } catch (err) {
        console.error("Recaptcha default init error:", err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setError(null);
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+49${phone.replace(/^0/, '')}`;
      if (!auth.currentUser) throw new Error("Nicht angemeldet.");
      
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmationResult = await linkWithPhoneNumber(auth.currentUser, formattedPhone, appVerifier);
      (window as any).confirmationResult = confirmationResult;
      setStep('OTP');
    } catch (err: any) {
      console.error('Phone link error:', err);
      if (err.code === 'auth/credential-already-in-use') {
        setError('Diese Mobilfunknummer ist bereits mit einem anderen Konto verknüpft.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Bitte geben Sie eine gültige Mobilfunknummer ein (z.B. +49 151 ...).');
      } else {
        setError('SMS konnte nicht zugestellt werden. Bitte versuchen Sie es später erneut.');
      }
      
      // Reset recaptcha on error so they can try again
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.render().then((widgetId: any) => {
          (window as any).grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return;
    setError(null);
    setLoading(true);

    try {
      const confirmationResult = (window as any).confirmationResult;
      const result = await confirmationResult.confirm(otp);
      
      // Linked successfully! Update Firestore
      await updateDoc(doc(db, 'users', userId), {
        phoneVerified: true,
        phoneNumber: result.user.phoneNumber,
        updatedAt: new Date()
      });

      // Also set the correct trial access cookie immediately so the UI unlocks
      document.cookie = "trial_access=true; path=/; max-age=86400; SameSite=Lax";
      
      onSuccess();
    } catch (err: any) {
      console.error("OTP Error:", err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Der eingegebene Bestätigungscode ist inkorrekt.');
      } else if (err.code === 'auth/credential-already-in-use') {
        setError('Diese Mobilfunknummer wurde in der Zwischenzeit anderweitig verifiziert.');
      } else {
        setError('Fehler bei der Verifizierung.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="w-16 h-16 bg-[#F0FDF4] rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
            <Shield className="w-8 h-8 text-[#10B981]" />
          </div>

          <h3 className="text-2xl font-bold text-center text-[#111827] mb-2 tracking-tight">Kostenfreier Testzugang</h3>
          
          <p className="text-center text-gray-500 mb-8 text-sm leading-relaxed">
            Zur Gewährleistung der Qualität und Sicherheit unserer Plattform bitten wir um eine einmalige Verifizierung Ihrer Mobilfunknummer via SMS.
          </p>

          <div id="recaptcha-container"></div>

          {step === 'PHONE' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mobilfunknummer</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="+49 151 12345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#00B4D8] outline-none font-medium text-gray-700"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
              <button 
                type="submit" 
                disabled={loading || !phone}
                className="w-full py-4 bg-[#111827] text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Sende SMS...' : 'Code senden'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
               <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">6-stelliger Bestätigungscode</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#00B4D8] outline-none font-bold text-center text-lg tracking-[0.2em] text-[#111827]"
                  maxLength={6}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
              <button 
                type="submit" 
                disabled={loading || otp.length < 6}
                className="w-full py-4 bg-[#10B981] text-white font-bold rounded-xl hover:bg-[#059669] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {loading ? 'Prüfe...' : 'Bestätigen'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('PHONE'); setError(null); }}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                Nummer korrigieren
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-start gap-3">
             <div className="bg-gray-100 p-1.5 rounded-lg shrink-0">
               <Shield className="w-4 h-4 text-gray-400" />
             </div>
             <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
               Ihre Mobilfunknummer dient ausschließlich der Authentifizierung und wird streng vertraulich behandelt. Eine <strong className="text-gray-500">werbliche Nutzung ist ausgeschlossen</strong>. 
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
