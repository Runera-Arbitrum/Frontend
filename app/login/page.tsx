'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import { Zap } from 'lucide-react';

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
        <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
          <Zap size={40} className="text-white" />
        </div>

        <h1 className="text-3xl font-bold text-text-primary text-center mb-2">
          Runera
        </h1>
        <p className="text-base text-text-secondary text-center mb-1">
          Move to Earn on Arbitrum
        </p>
        <p className="text-sm text-text-tertiary text-center max-w-xs mb-12">
          Run, earn XP, level up your tier, and collect unique NFTs
        </p>

        {/* Tier Preview */}
        <div className="flex items-center gap-2 mb-12">
          {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((tier, i) => (
            <div
              key={tier}
              className={`tier-${tier.toLowerCase()} w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm`}
              style={{ opacity: 0.5 + i * 0.12 }}
            >
              {tier[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Login Section */}
      <div className="px-6 pb-10">
        <Button
          variant="primary"
          size="lg"
          className="w-full h-14 text-base rounded-2xl mb-3"
          onClick={login}
        >
          Get Started
        </Button>

        <p className="text-center text-[10px] text-text-tertiary mt-4 px-4">
          Connect with email, Google, or your existing wallet.
          <br />
          Powered by Privy — your keys, your wallet.
        </p>
      </div>
    </div>
  );
}
