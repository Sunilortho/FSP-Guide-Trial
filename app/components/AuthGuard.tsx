'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (!user) {
        // Not logged in — redirect to home (which will route to /payment if necessary)
        router.replace('/');
        return;
      }
      setStatus('authorized');
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
