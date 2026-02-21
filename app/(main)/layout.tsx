'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/layout/AuthGuard';
import BottomNav from '@/components/layout/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Check initial state
    const checkRecording = () => {
      const recording = typeof window !== 'undefined' && window.localStorage.getItem('runera_recording') === 'true';
      setIsRecording(recording);
    };

    checkRecording();

    // Listen for changes
    window.addEventListener('storage', checkRecording);
    return () => window.removeEventListener('storage', checkRecording);
  }, []);

  return (
    <AuthGuard>
      <div className={isRecording ? 'mobile-container' : 'mobile-container pb-24'}>
        {children}
      </div>
      {!isRecording && <BottomNav />}
    </AuthGuard>
  );
}
