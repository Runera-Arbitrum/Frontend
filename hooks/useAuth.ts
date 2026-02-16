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
    if (!user) return null;
    const embedded = wallets.find((w) => w.walletClientType === 'privy');
    return embedded?.address ?? null;
  }, [user, wallets]);

  const activeWallet = useMemo(() => {
    const embedded = wallets.find((w) => w.walletClientType === 'privy');
    return embedded ?? null;
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
