'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMemo } from 'react';

/**
 * Unified auth hook wrapping Privy.
 * Provides wallet address, auth state, and login/logout actions.
 * All components should use this instead of calling Privy hooks directly.
 */
export function useAuth() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const walletAddress = useMemo(() => {
    // Prefer embedded wallet, then first external
    if (!user) return null;
    const embedded = wallets.find((w) => w.walletClientType === 'privy');
    if (embedded) return embedded.address;
    return wallets[0]?.address ?? null;
  }, [user, wallets]);

  const activeWallet = useMemo(() => {
    if (!wallets.length) return null;
    const embedded = wallets.find((w) => w.walletClientType === 'privy');
    return embedded ?? wallets[0] ?? null;
  }, [wallets]);

  return {
    ready,
    authenticated,
    user,
    walletAddress,
    activeWallet,
    wallets,
    login,
    logout,
  };
}
