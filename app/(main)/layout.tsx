'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/layout/AuthGuard';
import BottomNav from '@/components/layout/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const checkRecording = () => {
      const recording = typeof window !== 'undefined' && window.localStorage.getItem('runera_recording') === 'true';
      setIsRecording(recording);
    };

    checkRecording();

    window.addEventListener('storage', checkRecording);
    return () => window.removeEventListener('storage', checkRecording);
  }, []);

  if (isRecording) {
    return (
      <AuthGuard>
        <div className="mobile-container">
          {children}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          position: 'relative',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
