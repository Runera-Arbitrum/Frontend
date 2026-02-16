'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Image from 'next/image';

export default function LoginPage() {
  const { ready, authenticated, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace('/home');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen flex flex-col bg-gentle-gradient">
      {/* Hero — centered, breathing room */}
      <div className="flex-1 flex flex-col items-center justify-center px-10">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/runera biru.png"
            alt="Runera"
            width={80}
            height={80}
            className="rounded-[22px] shadow-soft"
          />
        </div>

        <h1 className="text-2xl font-semibold text-text-primary text-center tracking-tight mb-2">
          Runera
        </h1>
        <p className="text-sm text-text-secondary text-center leading-relaxed mb-2">
          Your gentle running companion
        </p>
        <p className="text-xs text-text-tertiary text-center max-w-[260px] leading-relaxed">
          Track your runs, build streaks, and collect unique rewards — at your own pace.
        </p>

        {/* Tier Preview — subtle, soft circles */}
        <div className="flex items-center gap-3 mt-10">
          {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((tier, i) => (
            <div
              key={tier}
              className={`tier-${tier.toLowerCase()} w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-semibold shadow-sm`}
              style={{ opacity: 0.45 + i * 0.14 }}
            >
              {tier[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Login Section — clean, minimal */}
      <div className="px-8 pb-12">
        <Button
          variant="primary"
          size="lg"
          className="w-full h-[52px] text-[15px] font-medium rounded-2xl shadow-gentle"
          onClick={login}
        >
          Get Started
        </Button>

        <p className="text-center text-[11px] text-text-tertiary mt-5 px-2 leading-relaxed">
          Sign in with email or Google to get started.
          <br />
          Powered by Privy — secure and easy.
        </p>
      </div>
    </div>
  );
}
