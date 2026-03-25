'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { Stethoscope, Mail, Lock, AlertTriangle, ShieldCheck, CheckCircle2, User as UserIcon, MapPin } from 'lucide-react';

export default function PaymentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Auth form
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is already paid in Firestore
        const { doc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.isPaid === true || userData.hasPaid === true) {
            // Set the user_paid cookie (1 year expiry)
            document.cookie = 'user_paid=true; path=/; max-age=31536000; SameSite=Lax';
            // Redirect to home
            window.location.href = '/';
            return;
          }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwörter stimmen nicht überein.');
        }
        if (!name || !address) {
          throw new Error('Bitte füllen Sie alle Felder aus.');
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save extra user details to Firestore
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const { updateProfile } = await import('firebase/auth');
        
        await updateProfile(userCredential.user, { displayName: name });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          displayName: name,
          email: email,
          address: address,
          createdAt: serverTimestamp()
        }, { merge: true });

      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Only clear passwords on success
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.message === 'Passwörter stimmen nicht überein.' || error.message === 'Bitte füllen Sie alle Felder aus.') {
        setAuthError(error.message);
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError('Diese E-Mail wird bereits verwendet.');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        setAuthError('Ungültige E-Mail oder Passwort.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('Passwort zu schwach (mind. 6 Zeichen).');
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError('E-Mail-Anmeldung ist in Firebase noch nicht aktiviert!');
      } else {
        setAuthError(error.message || 'Ein Fehler ist aufgetreten.');
      }
    }
    setAuthLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setAuthError('Bitte geben Sie zuerst Ihre E-Mail-Adresse ein.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setResetSuccess(false);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSuccess(true);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        setAuthError('Diese E-Mail-Adresse ist nicht registriert.');
      } else {
        setAuthError('Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.');
      }
    }
    setAuthLoading(false);
  };

  const handlePayment = async () => {
    if (!user) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Fehler beim Erstellen der Zahlungssitzung.');
        setCheckoutLoading(false);
      }
    } catch {
      alert('Netzwerkfehler. Bitte überprüfe deine Verbindung.');
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
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div className="bg-[#00B4D8] p-2 rounded-xl shadow-sm">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827]">
            FSP Guide for <span className="font-serif italic font-medium">busy professionals</span>
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] mb-4">
            Vollständiger Zugang für nur <span className="text-[#00B4D8]">€22</span>
          </h2>
          <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
            Kein Abo. Kein weiterer Aufwand. Einmaliger Zugang zu allen KI-Simulatoren und Lernmaterialien.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-xl overflow-hidden max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-[#111827] to-[#1f2937] p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#00B4D8]/20 rounded-full blur-2xl"></div>
            <h3 className="text-2xl font-bold text-white mb-2 relative z-10">FSP Guide – Vollzugang</h3>
            <div className="flex justify-center items-end gap-2 text-white relative z-10">
              <span className="text-5xl font-black">€22</span>
              <span className="text-[#9CA3AF] mb-1">/ einmalig</span>
            </div>
            <p className="text-[#9CA3AF] text-sm mt-4 font-medium relative z-10">
              Sofortiger Zugriff nach Bezahlung. Keine versteckten Gebühren.
            </p>
          </div>

          <div className="p-8 md:p-10">
            <ul className="space-y-4 mb-10">
              {[
                'Unbegrenzter FSP Simulator Zugang (Emotionale KI)',
                'Unbegrenztes Oberarzt-Training (Visite)',
                'Masterclass für 300+ medizinische Begriffe',
                'Intensive Arztbrief-Korrekturen in Sekunden',
                'Detaillierte Historie & Leistungsanalyse',
                'Zukünftige Updates inklusive',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" />
                  <span className="font-medium text-[#4B5563]">{feature}</span>
                </li>
              ))}
            </ul>

            {!user ? (
              /* Sign-in / Sign-up form */
              <div className="border border-[#E5E7EB] rounded-2xl p-6 mb-6">
                <p className="text-sm font-bold text-[#4B5563] mb-4">
                  {isSignUp ? 'Konto erstellen, um fortzufahren' : 'Anmelden, um fortzufahren'}
                </p>
                <form onSubmit={handleAuth} className="space-y-3">
                  {isSignUp && (
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Vollständiger Name" required={isSignUp}
                        className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00B4D8] outline-none font-medium"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="ihre@email.de" required
                      className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00B4D8] outline-none font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Passwort" required minLength={6}
                      className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00B4D8] outline-none font-medium"
                    />
                  </div>
                  {isSignUp && (
                    <>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                          type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Passwort bestätigen" required={isSignUp} minLength={6}
                          className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00B4D8] outline-none font-medium"
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-4 h-4 text-[#9CA3AF]" />
                        <textarea
                          value={address} onChange={(e) => setAddress(e.target.value)}
                          placeholder="Rechnungsadresse (Straße, PLZ, Ort)" required={isSignUp} rows={2}
                          className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00B4D8] outline-none font-medium resize-none"
                        />
                      </div>
                    </>
                  )}
                  {authError && (
                    <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
                      <p className="text-sm text-[#EF4444] font-medium">{authError}</p>
                    </div>
                  )}
                  {resetSuccess && (
                    <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                      <p className="text-sm text-[#065F46] font-medium">
                        ✅ E-Mail gesendet! Bitte prüfen Sie auch Ihren Spam-Ordner.
                      </p>
                    </div>
                  )}
                  <button type="submit" disabled={authLoading}
                    className="w-full py-3 bg-[#111827] text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50">
                    {authLoading ? 'Bitte warten...' : isSignUp ? 'Konto erstellen' : 'Anmelden'}
                  </button>
                </form>
                {!isSignUp && (
                  <button type="button" onClick={handleResetPassword} disabled={authLoading}
                    className="mt-3 text-sm font-medium text-[#6B7280] hover:text-[#111827] w-full text-center transition-colors">
                    Passwort vergessen?
                  </button>
                )}
                <button onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
                  className="mt-3 text-sm font-medium text-[#00B4D8] hover:underline w-full text-center">
                  {isSignUp ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
                </button>
              </div>
            ) : (
              /* Payment CTA */
              <button
                onClick={handlePayment}
                disabled={checkoutLoading}
                className="w-full py-4 px-8 bg-[#00B4D8] hover:bg-[#0077B6] text-white text-lg font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {checkoutLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Lade Checkout...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6" />
                    Jetzt für €22 freischalten →
                  </>
                )}
              </button>
            )}

            <p className="text-center text-xs text-[#9CA3AF] mt-4 font-medium">
              Sichere Zahlung abgewickelt durch Stripe
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
