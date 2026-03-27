'use client';

import { useState, useEffect, Suspense } from 'react';
import { auth, db } from '@/lib/firebase';
import { updateXP } from '@/lib/xp';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { Stethoscope, User as UserIcon, LogOut, BookOpen, Play, FileText, Activity, Mail, Lock, AlertTriangle, Shield, Star, MessageSquare, Flame } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AvatarUpload from '@/components/profile/AvatarUpload';
import RankBadge, { RankType } from '@/components/profile/RankBadge';
import ChatWindow from '@/components/chat/ChatWindow';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const RANK_THRESHOLDS: { [key: number]: RankType } = {
  0: 'Initiate',
  50: 'Page',
  200: 'Squire',
  500: 'Knight',
  1000: 'King'
};

function HomeContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Auth form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [profile, setProfile] = useState<{
    avatar_url?: string;
    rank: RankType;
    points: number;
    displayName: string;
    xpHistory?: { [key: string]: number };
    examRegion?: string;
    lastDailyChallengeDate?: string;
  }>({ rank: 'Initiate', points: 0, displayName: 'Doctor', xpHistory: {}, examRegion: '', lastDailyChallengeDate: '' });
  const [showChat, setShowChat] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showChatTooltip, setShowChatTooltip] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setTimeout(() => setPaymentSuccess(true), 0);
    }
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Check user profile
          const userRef = doc(db, 'users', currentUser.uid);
          const activityRef = doc(db, 'users', currentUser.uid, 'progress', 'activity');
          
          const [userSnap, activitySnap] = await Promise.all([
            getDoc(userRef),
            getDoc(activityRef).catch(e => {
              console.error('Error fetching activity:', e);
              return { exists: () => false, data: () => ({}) } as any;
            })
          ]);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const activityData = activitySnap.exists() ? activitySnap.data() : {};

            setProfile(prev => ({
              ...prev,
              avatar_url: data.avatar_url,
              rank: (data.rank as RankType) || 'Initiate',
              points: data.points || 0,
              displayName: data.displayName || currentUser.email?.split('@')[0] || 'Doctor',
              xpHistory: activityData,
              examRegion: data.examRegion || '',
              lastDailyChallengeDate: data.lastDailyChallengeDate || ''
            }));

            // --- Daily Streak Logic ---
            const today = new Date().toISOString().split('T')[0];
            const lastLogin = data.lastLoginDate || '';
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            let newStreak = data.streak || 0;
            if (lastLogin !== today) {
              if (lastLogin === yesterday) {
                newStreak = newStreak + 1;
              } else {
                newStreak = 1;
              }
              setStreak(newStreak);
              updateDoc(userRef, { streak: newStreak, lastLoginDate: today }).catch(console.error);
            } else {
              setStreak(newStreak);
            }

            // Restore trial access cookie if valid
            const currentLoginCount = data.loginCount || 0;
            if (!data.hasPaid) {
              if (currentLoginCount <= 2) {
                document.cookie = "trial_access=true; path=/; max-age=86400"; // Ensure it survives page refresh
              } else {
                document.cookie = "trial_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              }
            }

            // Show chat tooltip
            const hasSeenTooltip = localStorage.getItem('fsp_chat_tooltip_seen');
            if (!hasSeenTooltip) {
              setTimeout(() => setShowChatTooltip(true), 2000);
            }
          }
          
          // Fetch sessions
          const q = query(collection(db, 'practiceSessions'), where('userId', '==', currentUser.uid));
          const querySnapshot = await getDocs(q);
          setSessions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Error loading user data in onAuthStateChanged:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setSessions([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Rank Progression
  useEffect(() => {
    if (!user) return;
    let newRank: RankType = 'Initiate';
    const points = profile.points;
    if (points >= 1000) newRank = 'King';
    else if (points >= 500) newRank = 'Knight';
    else if (points >= 200) newRank = 'Squire';
    else if (points >= 50) newRank = 'Page';

    if (newRank !== profile.rank) {
      setProfile(prev => ({ ...prev, rank: newRank }));
      updateDoc(doc(db, 'users', user.uid), { rank: newRank }).catch(console.error);
    }
  }, [profile.points, user]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      /* Temporarily disabled because Vercel domain isn't whitelisted in ReCAPTCHA console
      if (window.grecaptcha?.enterprise) {
        const token = await window.grecaptcha.enterprise.execute('6LeA7JYsAAAAAE6LNsneNwTYJQpzu2GhQbsz8tCy', {action: 'LOGIN'});
        const verifyResp = await fetch('/api/auth/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'LOGIN' }),
        });
        const verifyData = await verifyResp.json();
        if (!verifyData.success) {
          setAuthError('Bot-Schutz: Verifizierung fehlgeschlagen.');
          setAuthLoading(false);
          return;
        }
      }
      */
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Increment login count and grant trial access if applicable
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (!data.hasPaid) {
          const count = (data.loginCount || 0) + 1;
          await updateDoc(userRef, { loginCount: count }).catch(console.error);
          if (count <= 2) {
            document.cookie = "trial_access=true; path=/; max-age=86400"; // 24 hours
          } else {
            document.cookie = "trial_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
        }
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError('E-Mail nicht gefunden oder Passwort falsch.');
      } else if (error.code === 'auth/wrong-password') {
        setAuthError('Falsches Passwort. Bitte versuchen Sie es erneut.');
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError('Zu viele Versuche. Bitte versuchen Sie es später erneut.');
      } else {
        setAuthError('Anmeldefehler. Bitte überprüfen Sie Ihre Daten.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setAuthError('Passwörter stimmen nicht überein.');
      return;
    }
    setAuthLoading(true);
    try {
      /* Temporarily disabled because Vercel domain isn't whitelisted in ReCAPTCHA console
      if (window.grecaptcha?.enterprise) {
        const token = await window.grecaptcha.enterprise.execute('6LeA7JYsAAAAAE6LNsneNwTYJQpzu2GhQbsz8tCy', {action: 'SIGNUP'});
        const verifyResp = await fetch('/api/auth/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'SIGNUP' }),
        });
        const verifyData = await verifyResp.json();
        if (!verifyData.success) {
          setAuthError('Bot-Schutz: Verifizierung fehlgeschlagen.');
          setAuthLoading(false);
          return;
        }
      }
      */
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.email?.split('@')[0] || 'Doctor',
        createdAt: serverTimestamp(),
        points: 0,
        streak: 1,
        lastLoginDate: new Date().toISOString().split('T')[0],
        loginCount: 1
      });
      document.cookie = "trial_access=true; path=/; max-age=86400"; // First login
    } catch (error: any) {
      console.error('Sign-up error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setIsSignUp(false); // Switch to login mode automatically
        setAuthError('Diese E-Mail ist bereits registriert. Bitte melden Sie sich an oder setzen Sie Ihr Passwort zurück.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('Das Passwort ist zu schwach (mind. 6 Zeichen).');
      } else if (error.code === 'auth/invalid-email') {
        setAuthError('Ungültige E-Mail-Adresse.');
      } else {
        setAuthError('Registrierungsfehler. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const [resetDebugLink, setResetDebugLink] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!email) {
      setAuthError('Bitte E-Mail eingeben.');
      return;
    }
    setAuthLoading(true);
    setResetDebugLink(null);
    setResetSuccess(false);

    try {
      // 1. Try Custom Premium API (Resend)
      const resp = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();

      if (resp.ok) {
        setResetSuccess(true);
        setAuthError(null);
        if (data.debugLink) setResetDebugLink(data.debugLink);
      } else {
        setAuthError(data.error || 'Server-Fehler beim Senden der E-Mail.');
      }
    } catch (err: any) {
      setAuthError('Netzwerkfehler. Bitte versuchen Sie es später erneut.');
    } finally {
      setAuthLoading(false);
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
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-[#00B4D8] p-2 rounded-xl shadow-sm">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827]">
            FSP Guide for <span className="font-serif italic font-medium">busy professionals</span>
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-[#D1FAE5] text-[#065F46] text-xs font-bold px-3 py-1.5 rounded-full border border-[#A7F3D0]">
              <Star className="w-3.5 h-3.5" />
              Premium
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {streak} {streak === 1 ? 'Tag' : 'Tage'} Streak
              </div>
            )}
            <div className="flex items-center gap-3 pr-2 border-r border-[#E5E7EB]">
              <RankBadge rank={profile.rank} showIconOnly />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#111827]">{profile.displayName}</span>
                <span className="text-[10px] text-[#6B7280] font-medium">{profile.points} Points</span>
              </div>
            </div>
            <button onClick={() => signOut(auth)} className="p-2 text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!user ? (
          <div className="text-center max-w-3xl mx-auto mt-8 flex flex-col items-center">
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#111827] mb-8 leading-[1.1]">
              Master the German Doctors Exam <br/> 
              <span className="text-[#00B4D8]">Efficiency First.</span>
            </h2>
            <div className="max-w-md w-full bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-[#111827]">{isSignUp ? 'Konto erstellen' : 'Anmelden'}</h3>
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                <input
                  type="email"
                  placeholder="E-Mail"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#00B4D8] outline-none"
                  required
                />
                <input
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#00B4D8] outline-none"
                  required
                />
                {isSignUp && (
                  <input
                    type="password"
                    placeholder="Passwort bestätigen"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#00B4D8] outline-none"
                    required
                  />
                )}
                {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
                {resetSuccess && (
                  <div className="space-y-4">
                    <p className="text-green-600 text-xs font-bold">✅ E-Mail gesendet! (Bitte auch im Spam-Ordner nachsehen)</p>
                    {resetDebugLink && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-2">Entwicklungs-Modus: Manueller Link</p>
                        <a 
                          href={resetDebugLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-center py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-all shadow-sm"
                        >
                          Direkt zum Passwort-Reset →
                        </a>
                        <p className="text-[9px] text-orange-600 mt-2 italic text-center">Dieser Button erscheint nur lokal für Tests.</p>
                      </div>
                    )}
                  </div>
                )}
                <button type="submit" disabled={authLoading} className="w-full py-3 bg-[#111827] text-white font-bold rounded-xl hover:bg-black transition-all">
                  {authLoading ? 'Laden...' : (isSignUp ? 'Registrieren' : 'Anmelden')}
                </button>
              </form>
              <div className="mt-4 flex flex-col gap-2">
                <button onClick={handleResetPassword} className="text-xs text-gray-500 hover:text-[#00B4D8] transition-colors">Passwort vergessen?</button>
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-[#00B4D8] font-bold">
                  {isSignUp ? 'Schon ein Konto? Login' : 'Noch kein Konto? Registrieren'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#111827] mb-2 uppercase tracking-tight">Übersicht</h2>
                <p className="text-gray-500">Willkommen zurück zur FSP Vorbereitung.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Simulator', icon: Play, color: 'bg-[#00B4D8]', link: '/simulator' },
                  { label: 'Oberarzt', icon: UserIcon, color: 'bg-[#F5A623]', link: '/oberarzt' },
                  { label: 'Begriffe', icon: BookOpen, color: 'bg-[#6366F1]', link: '/begriffe' },
                  { label: 'Arztbrief', icon: FileText, color: 'bg-[#10B981]', link: '/arztbrief' },
                ].map(item => (
                  <Link key={item.label} href={item.link} className="group bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-6 hover:shadow-lg transition-all text-center">
                    <div className={`${item.color} w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-sm text-[#111827]">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6 mb-10">
                <div className="lg:col-span-2">
                  <WeeklyProgressChart xpHistory={profile.xpHistory || {}} />
                </div>
                <div className="bg-[#111827] rounded-[32px] p-8 text-white flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                      <Star className="w-6 h-6 text-[#00B4D8]" />
                    </div>
                    <h4 className="text-xl font-bold mb-2 uppercase tracking-tight">Tagesziel</h4>
                    <p className="text-white/50 text-xs leading-relaxed">Erreiche heute 100 XP für den Streak-Erhalt.</p>
                  </div>
                  <div className="mt-8">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest">
                      <span className="text-white/40">Heute</span>
                      <span className="text-[#00B4D8]">{profile.xpHistory?.[new Date().toISOString().split('T')[0]] || 0} / 100 XP</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#00B4D8] h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_#00B4D8]" 
                        style={{ width: `${Math.min(((profile.xpHistory?.[new Date().toISOString().split('T')[0]] || 0) / 100) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1">
                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[32px] p-8 h-full flex flex-col items-center justify-center">
                        <AvatarUpload
                          userId={user.uid}
                          displayName={profile.displayName}
                          currentAvatarUrl={profile.avatar_url}
                          onUploadSuccess={(url) => setProfile(prev => ({ ...prev, avatar_url: url }))}
                        />
                        <div className="mt-6 text-center w-full">
                          <p className="font-bold text-[#111827]">{profile.displayName}</p>
                          <div className="flex flex-col items-center gap-4 mt-2">
                            <RankBadge rank={profile.rank} />
                            <div className="w-full px-2">
                              <div className="flex justify-between items-center mb-1.5">
                                <label className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Nächster Meilenstein</label>
                                <span className="text-[10px] font-bold text-[#00B4D8]">{Math.min(profile.points, 1000)}/1000 XP</span>
                              </div>
                              <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((profile.points / 1000) * 100, 100)}%` }}
                                  className="h-full bg-gradient-to-r from-[#00B4D8] to-[#007791] rounded-full shadow-[0_0_8px_rgba(0,180,216,0.5)] transition-all duration-1000"
                                />
                              </div>
                              <p className="text-[9px] text-[#9CA3AF] mt-2 font-bold uppercase tracking-wider text-center">
                                {profile.rank === 'King' ? 'MÄCHTIGSTER STATUS ERREICHT' : `${1000 - profile.points} XP BIS KING`}
                              </p>
                            </div>
                            <div className="w-full px-2 mt-2">
                              <label className="block text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1.5">Prüfungsregion</label>
                              <select 
                                value={profile.examRegion || ''} 
                                onChange={(e) => {
                                  const newRegion = e.target.value;
                                  setProfile(prev => ({ ...prev, examRegion: newRegion }));
                                  updateDoc(doc(db, 'users', user.uid), { examRegion: newRegion }).catch(console.error);
                                }}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-[11px] font-bold text-[#111827] focus:ring-2 focus:ring-[#00B4D8] outline-none transition-all cursor-pointer appearance-none text-center shadow-sm"
                              >
                                <option value="">Region wählen...</option>
                                {['Bayern', 'Baden-Württemberg', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'].map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                    </div>
                 </div>
                 <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-[#111827]">Station Chat</h3>
                      <button onClick={() => setShowChat(!showChat)} className="text-sm font-bold text-[#00B4D8]">
                        {showChat ? 'Schließen' : 'Öffnen'}
                      </button>
                    </div>
                    {showChat ? (
                       <ChatWindow userId={user.uid} conversationId="global" userRank={profile.rank} userName={profile.displayName} />
                    ) : (
                      <div className="h-[200px] bg-[#F9FAFB] rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm font-medium">Chat vorübergehend ausgeblendet</span>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="mt-8">
              <DailyChallenge 
                userId={user.uid} 
                lastCompleted={profile.lastDailyChallengeDate} 
                onComplete={(xp) => {
                  const today = new Date().toISOString().split('T')[0];
                  setProfile(prev => ({ 
                    ...prev, 
                    points: prev.points + xp,
                    lastDailyChallengeDate: today,
                    xpHistory: {
                      ...prev.xpHistory,
                      [today]: (prev.xpHistory?.[today] || 0) + xp
                    }
                  }));
                }} 
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mt-8">
              <div className="lg:col-span-1">
                 <Leaderboard currentUserId={user.uid} />
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm h-full">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#00B4D8]" />
                    Letzte Aktivitäten
                  </h3>
                  {sessions.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
                      Noch keine Sitzungen aufgezeichnet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.slice(0, 5).map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-[#F3F4F6] rounded-2xl hover:border-[#00B4D8] transition-all">
                          <div>
                            <p className="font-bold text-sm block">{s.scenarioId}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-black uppercase tracking-widest">Simulation</p>
                          </div>
                          <span className="text-sm font-black text-[#10B981]">{s.score || 0}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const DAILY_CHALLENGES = [
  { q: "Was bedeutet 'Dyspnoe'?", options: ["Atemnot", "Herzrasen", "Brustschmerz", "Schwindel"], a: 0 },
  { q: "Was ist eine 'Anamnese'?", options: ["Vorgeschichte", "Untersuchung", "Therapie", "Diagnose"], a: 0 },
  { q: "Andere Bezeichnung für 'Appendix vermiformis'?", options: ["Blinddarm", "Magen", "Leber", "Galle"], a: 0 },
  { q: "Was bedeutet 'Hypertonie'?", options: ["Hoher Blutdruck", "Niedriger Blutdruck", "Hoher Puls", "Niedriger Puls"], a: 0 },
  { q: "Was ist ein 'Abdomen'?", options: ["Oberkörper", "Bauchraum", "Unterarm", "Oberschenkel"], a: 1 }
];

const DailyChallenge = ({ userId, lastCompleted, onComplete }: { userId: string, lastCompleted?: string, onComplete: (xp: number) => void }) => {
  const [showChallenge, setShowChallenge] = useState(false);
  const [challenge, setChallenge] = useState<any>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const isCompleted = lastCompleted === today;

  useEffect(() => {
    const daySeed = new Date().getDate() % DAILY_CHALLENGES.length;
    setChallenge(DAILY_CHALLENGES[daySeed]);
  }, []);

  if (isCompleted) return (
    <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[32px] p-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#10B981] rounded-2xl flex items-center justify-center shadow-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-[#111827]">Tages-Herausforderung abgeschlossen!</h4>
          <p className="text-[#065F46] text-sm font-medium">Gute Arbeit. Morgen gibt es eine neue Aufgabe.</p>
        </div>
      </div>
      <div className="text-[#10B981] font-black text-xl">+20 XP</div>
    </div>
  );

  const handleCheck = async () => {
    if (selected === challenge.a) {
      setResult('correct');
      await updateXP(userId, 20);
      setTimeout(() => onComplete(20), 1000);
    } else {
      setResult('wrong');
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F5A623] rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#111827]">Daily Challenge</h3>
        </div>
        {!showChallenge && (
          <button 
            onClick={() => setShowChallenge(true)}
            className="px-6 py-2 bg-[#111827] text-white font-bold rounded-xl hover:bg-black transition-all"
          >
            Start (+20 XP)
          </button>
        )}
      </div>

      {!showChallenge ? (
        <p className="text-[#6B7280]">Testen Sie Ihr Wissen mit einer schnellen medizinischen Frage für heute.</p>
      ) : (
        <div className="space-y-6">
          <p className="font-bold text-lg text-[#111827]">{challenge.q}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {challenge.options.map((opt: string, i: number) => (
              <button 
                key={i}
                onClick={() => setSelected(i)}
                className={`p-4 rounded-xl text-left font-bold text-sm border-2 transition-all ${
                  selected === i 
                    ? 'border-[#00B4D8] bg-[#E0F7FA] text-[#007791]' 
                    : 'border-[#E5E7EB] hover:border-[#D1D5DB] text-[#4B5563]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          
          {result === 'correct' && (
            <div className="flex items-center gap-2 text-[#10B981] font-bold text-sm">
              <Shield className="w-4 h-4" /> Richtig! +20 XP...
            </div>
          )}
          {result === 'wrong' && (
            <div className="text-[#EF4444] font-bold text-sm">
              Falsch. Versuchen Sie es noch einmal!
            </div>
          )}

          {!result && (
            <button 
              onClick={handleCheck}
              disabled={selected === null}
              className="w-full py-4 bg-[#00B4D8] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              Antwort prüfen
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Leaderboard = ({ currentUserId }: { currentUserId: string }) => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const q = query(
          collection(db, 'users'), 
          where('points', '>', 0),
          // Note: In production you'd need an index for this. Using client-side sort for small scale if index is missing.
        );
        const snap = await getDocs(q);
        const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
          .slice(0, 5);
        setLeaders(users);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  return (
    <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center shadow-lg">
          <Star className="w-5 h-5 text-[#B8860B]" />
        </div>
        <h3 className="text-xl font-bold text-[#111827]">Bestenliste</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00B4D8]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {leaders.map((leader, i) => (
            <div 
              key={leader.id} 
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                leader.id === currentUserId 
                  ? 'bg-[#E0F7FA] border-[#00B4D8] shadow-md' 
                  : 'bg-[#F9FAFB] border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black w-5 ${i === 0 ? 'text-[#FFD700]' : 'text-gray-400'}`}>#{i + 1}</span>
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white shadow-sm bg-white">
                  {leader.avatar_url ? (
                    <Image src={leader.avatar_url} alt={leader.displayName} fill className="object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#111827] truncate max-w-[80px]">
                    {leader.displayName}
                    {leader.id === currentUserId && " (Du)"}
                  </span>
                  <RankBadge rank={leader.rank as RankType || 'Initiate'} />
                </div>
              </div>
              <span className="text-xs font-black text-[#111827]">{leader.points || 0} XP</span>
            </div>
          ))}
          {leaders.length === 0 && (
            <p className="text-center text-gray-400 text-xs py-10">Noch keine Daten verfügbar.</p>
          )}
        </div>
      )}
    </div>
  );
};

const WeeklyProgressChart = ({ xpHistory }: { xpHistory: { [key: string]: number } }) => {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const data = last7Days.map(date => ({
    label: days[(new Date(date).getDay() + 6) % 7],
    value: xpHistory[date] || 0,
    isToday: date === today.toISOString().split('T')[0]
  }));

  const maxXP = Math.max(...data.map(d => d.value), 100);

  return (
    <div className="bg-white rounded-[32px] p-6 border border-[#E5E7EB] shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h4 className="font-bold text-[#111827] text-sm uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00B4D8]" />
          Aktivität
        </h4>
      </div>
      <div className="flex items-end justify-between flex-grow gap-2 px-1">
        {data.map((day, i) => (
          <div key={i} className="flex-grow flex flex-col items-center gap-2 h-full justify-end group">
            <div className="w-full bg-[#F9FAFB] rounded-xl relative overflow-hidden h-32 flex flex-col justify-end border border-[#F3F4F6]">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${(day.value / maxXP) * 100}%` }}
                className={`w-full rounded-t-xl transition-colors ${day.isToday ? 'bg-[#00B4D8]' : 'bg-[#E5E7EB] group-hover:bg-[#D1D5DB]'}`}
              />
            </div>
            <span className={`text-[10px] font-black ${day.isToday ? 'text-[#00B4D8]' : 'text-[#9CA3AF]'}`}>{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <HomeContent />
    </Suspense>
  );
}
