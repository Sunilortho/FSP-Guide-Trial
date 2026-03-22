'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const MAX_TRIAL_LOGINS = 2;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        // Not logged in — redirect to home
        router.replace('/');
        return;
      }

      // Check trial status
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          const loginCount = data.loginCount || 0;
          
          if (loginCount > MAX_TRIAL_LOGINS) {
            // Trial expired — redirect to home (the homepage will show the expired message)
            router.replace('/?expired=true');
            return;
          }
        }

        setStatus('authorized');
      } catch (error) {
        console.error('Error checking trial status:', error);
        // On error, still allow access rather than blocking
        setStatus('authorized');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B4D8]"></div>
          <p className="text-sm font-medium text-[#6B7280]">Zugriff wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return null; // Will redirect
  }

  return <>{children}</>;
}
