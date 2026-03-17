'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Stethoscope, User as UserIcon, LogOut, BookOpen, Download, Play, FileText, Activity } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user profile exists
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Doctor',
            createdAt: serverTimestamp(),
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

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E14]">
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
            <div className="flex items-center gap-2 text-sm font-medium text-[#4B5563]">
              <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center border border-[#E5E7EB]">
                <UserIcon className="w-4 h-4 text-[#6B7280]" />
              </div>
              {user.displayName || user.email}
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={handleSignIn}
            className="px-5 py-2.5 bg-[#111827] hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            Sign In
          </button>
        )}
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
            <button 
              onClick={handleSignIn}
              className="px-10 py-4 bg-[#111827] hover:bg-black text-white text-lg font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
            >
              Start Training Now
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-10 shadow-sm">
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-[#111827] mb-3">Willkommen zurück, Herr Doktor.</h2>
                <p className="text-lg text-[#6B7280]">Your path to medical recognition in Germany, optimized for your schedule.</p>
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
