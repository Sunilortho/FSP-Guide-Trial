'use client';

import { useState, useEffect, Suspense } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { Stethoscope, User as UserIcon, LogOut, BookOpen, Play, FileText, Activity, Mail, Lock, AlertTriangle, Shield, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import AvatarUpload from '@/components/profile/AvatarUpload';
import RankBadge, { RankType } from '@/components/profile/RankBadge';
import ChatWindow from '@/components/chat/ChatWindow';

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
  const [profile, setProfile] = useState<{
    avatar_url?: string;
    rank: RankType;
    points: number;
    displayName: string;
  }>({ rank: 'Initiate', points: 0, displayName: 'Doctor' });
  const [showChat, setShowChat] = useState(false);

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
        // Check user profile and login count
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          
          setProfile({
            avatar_url: data.avatar_url,
            rank: (data.rank as RankType) || 'Initiate',
            points: data.points || 0,
            displayName: data.displayName || currentUser.email?.split('@')[0] || 'Doctor',
          });
        }
        
        // Fetch practice sessions
        const q = query(collection(db, 'practiceSessions'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const userSessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSessions(userSessions);
      } else {
        setSessions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Rank Progression Logic
  useEffect(() => {
    if (!user) return;

    let newRank: RankType = 'Initiate';
    const points = profile.points;

    if (points >= 1000) newRank = 'King';
    else if (points >= 500) newRank = 'Knight';
    else if (points >= 200) newRank = 'Squire';
    else if (points >= 50) newRank = 'Page';

    if (newRank !== profile.rank) {
      setTimeout(() => setProfile(prev => ({ ...prev, rank: newRank })), 0);
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { rank: newRank }).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.points, user]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError('Ungültige E-Mail oder Passwort. Bitte versuchen Sie es erneut.');
      } else if (error.code === 'auth/wrong-password') {
        setAuthError('Falsches Passwort. Bitte versuchen Sie es erneut.');
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError('Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.');
      } else {
        setAuthError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
    }
    setAuthLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (password !== confirmPassword) {
      setAuthError('Passwörter stimmen nicht überein.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setAuthLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;

      // Create user profile
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.email?.split('@')[0] || 'Doctor',
        createdAt: serverTimestamp(),
      });

      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error signing up:', error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('Diese E-Mail-Adresse wird bereits verwendet. Bitte melden Sie sich an.');
      } else if (error.code === 'auth/invalid-email') {
        setAuthError('Ungültige E-Mail-Adresse.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('Das Passwort ist zu schwach. Mindestens 6 Zeichen erforderlich.');
      } else {
        setAuthError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
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
        
        {user ? (
          <div className="flex items-center gap-6">
            {/* Account Status Badge */}
            <div className="flex items-center gap-2 bg-[#D1FAE5] text-[#065F46] text-xs font-bold px-3 py-1.5 rounded-full border border-[#A7F3D0]">
              <Star className="w-3.5 h-3.5" />
              Premium
            </div>
            <div className="flex items-center gap-3 pr-2 border-r border-[#E5E7EB]">
               <RankBadge rank={profile.rank} showIconOnly />
               <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#111827]">{profile.displayName}</span>
                  <span className="text-[10px] text-[#6B7280] font-medium">{profile.points} Points</span>
               </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#4B5563]">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6]">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-[#6B7280] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {!user ? (
          <div className="text-center max-w-3xl mx-auto mt-8">
            <h2 className="text-6xl font-extrabold tracking-tight text-[#111827] mb-8 leading-[1.1]">
              Master the German Doctors Exam <br/> 
              <span className="text-[#00B4D8]">Efficiency First.</span>
            </h2>
            <p className="text-xl text-[#4B5563] mb-12 leading-relaxed max-w-2xl mx-auto">
              The definitive FSP preparation tool for <span className="font-serif italic">busy professionals</span>. 
              High-fidelity AI simulations, instant feedback, and structured learning paths.
            </p>

            {/* Email/Password Auth Form */}
            <div className="max-w-md mx-auto bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#00B4D8] rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#111827]">
                  {isSignUp ? 'Konto erstellen' : 'Anmelden'}
                </h3>
              </div>

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#4B5563] mb-2 text-left">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ihre@email.de"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00B4D8] focus:border-[#00B4D8] outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4B5563] mb-2 text-left">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00B4D8] focus:border-[#00B4D8] outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-sm font-bold text-[#4B5563] mb-2 text-left">Passwort bestätigen</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00B4D8] focus:border-[#00B4D8] outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                )}

                {authError && (
                  <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
                    <p className="text-sm text-[#EF4444] font-medium">{authError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full px-6 py-4 bg-[#111827] hover:bg-black text-white text-lg font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {authLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Bitte warten...</span>
                    </div>
                  ) : isSignUp ? (
                    'Konto erstellen'
                  ) : (
                    'Anmelden'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
                  className="text-sm font-medium text-[#00B4D8] hover:underline"
                >
                  {isSignUp ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-10 shadow-sm">
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-[#111827] mb-3">Willkommen zurück, Herr Doktor.</h2>
                <p className="text-lg text-[#6B7280]">Your path to medical recognition in Germany, optimized for your schedule.</p>
                
                {/* Account Status indicator */}
                <div className="mt-4 inline-flex items-center gap-2 bg-[#D1FAE5] text-[#065F46] text-sm font-bold px-4 py-2 rounded-full border border-[#A7F3D0]">
                  <Star className="w-4 h-4" />
                  Vollversion Aktiviert. Viel Erfolg!
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/simulator" className="group bg-[#F9FAFB] border border-[#E5E7EB] rounded-3xl p-8 hover:border-[#00B4D8] hover:bg-white hover:shadow-xl transition-all">
                  <div className="w-12 h-12 bg-[#00B4D8] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] mb-2">FSP Simulator</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">Practice patient interviews with emotional AI voices.</p>
                </Link>

                <Link href="/oberarzt" className="group bg-[#F9FAFB] border border-[#E5E7EB] rounded-3xl p-8 hover:border-[#F5A623] hover:bg-white hover:shadow-xl transition-all">
                  <div className="w-12 h-12 bg-[#F5A623] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] mb-2">Oberarzt</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">Present cases to a senior physician and handle the grill.</p>
                </Link>
                
                <Link href="/begriffe" className="group bg-[#F9FAFB] border border-[#E5E7EB] rounded-3xl p-8 hover:border-[#6366F1] hover:bg-white hover:shadow-xl transition-all">
                  <div className="w-12 h-12 bg-[#6366F1] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] mb-2">Begriffe</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">Master 300+ essential medical terms and idioms.</p>
                </Link>

                <Link href="/arztbrief" className="group bg-[#F9FAFB] border border-[#E5E7EB] rounded-3xl p-8 hover:border-[#10B981] hover:bg-white hover:shadow-xl transition-all">
                  <div className="w-12 h-12 bg-[#10B981] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] mb-2">Arztbrief</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">AI-powered correction for your medical letters.</p>
                </Link>
              </div>

              {/* Profile & Settings Section */}
              <div className="mt-12 pt-12 border-t border-[#E5E7EB] grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <h3 className="text-xl font-bold text-[#111827]">Account Profil</h3>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[32px] p-8 flex flex-col items-center">
                    <div className="relative">
                      <AvatarUpload
                        userId={user.uid}
                        displayName={profile.displayName || user.displayName || 'User'}
                        currentAvatarUrl={profile.avatar_url}
                        onUploadSuccess={(url) => {
                          setProfile(prev => ({ ...prev, avatar_url: url, points: prev.points + 20 }));
                          updateDoc(doc(db, 'users', user.uid), {
                            avatar_url: url,
                            points: increment(20)
                          });
                        }}
                      />
                      <div className="absolute -top-2 -right-2 transform scale-125 z-10">
                        <RankBadge rank={profile.rank} showIconOnly={true} />
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <p className="font-bold text-lg text-[#111827]">{profile.displayName}</p>
                      <p className="text-sm text-[#6B7280] mb-4">{user.email}</p>
                      <RankBadge rank={profile.rank} />
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-[#00B4D8] h-full transition-all duration-500" 
                          style={{ width: `${Math.min((profile.points / 1000) * 100, 100)}%` }} 
                        />
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] mt-2 font-bold uppercase tracking-wider">{profile.points} / 1000 XP TO KING</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#111827]">Station Chat</h3>
                    <button 
                      onClick={() => setShowChat(!showChat)}
                      className="text-sm font-bold text-[#00B4D8] hover:underline flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {showChat ? 'Chat ausblenden' : 'Chat anzeigen'}
                    </button>
                  </div>
                  
                  {showChat ? (
                    <ChatWindow 
              userId={user.uid} 
              conversationId="global-case-discussion" 
              userRank={profile.rank}
              userAvatarUrl={profile.avatar_url}
              userName="FSP Case Discussion"
            />
                  ) : (
                    <div className="h-[500px] bg-[#F9FAFB] rounded-[32px] border border-dashed border-[#D1D5DB] flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-[#E5E7EB]">
                        <MessageSquare className="w-8 h-8 text-[#00B4D8]" />
                      </div>
                      <p className="text-[#6B7280] font-medium mb-2">Connect with other resident doctors.</p>
                      <button 
                        onClick={() => setShowChat(true)}
                        className="px-6 py-2 bg-[#111827] text-white font-bold rounded-xl hover:bg-black transition-all shadow-md"
                      >
                        Open Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-[#111827] flex items-center gap-3">
                  <Activity className="w-6 h-6 text-[#00B4D8]" />
                  Training History
                </h3>
                <span className="bg-[#F3F4F6] text-[#4B5563] text-sm font-bold px-4 py-1.5 rounded-full border border-[#E5E7EB]">
                  {sessions.length} Sessions
                </span>
              </div>
              
              {sessions.length === 0 ? (
                <div className="text-center py-16 bg-[#F9FAFB] rounded-[24px] border border-dashed border-[#D1D5DB]">
                  <p className="text-[#6B7280] font-medium mb-1">No training sessions recorded yet.</p>
                  <p className="text-sm text-[#9CA3AF]">Your progress will appear here as you complete simulations.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-6 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#00B4D8] hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
                          <Activity className="w-5 h-5 text-[#6B7280]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#111827]">{session.scenarioId}</p>
                          <p className="text-sm text-[#6B7280]">
                            {session.createdAt?.toDate ? session.createdAt.toDate().toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Pass Rate</p>
                        <p className="text-2xl font-black text-[#10B981]">{session.score || 0}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8F9FA' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #E5E7EB', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
