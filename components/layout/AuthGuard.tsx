'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/login');
    }
  }, [ready, authenticated, router]);

  // Loading state
  if (!ready) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-text-secondary">Loading Runera...</span>
        </div>
      </div>
    );
  }

  // Not authenticated — wait for redirect
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
