'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMemo } from 'react';

/**
 * Unified auth hook wrapping Privy.
 *
 * Wallet selection logic:
 * - Email/Google login → Privy embedded wallet (seamless, no popup)
 * - MetaMask/Coinbase login → external wallet (requires popup for TX approval)
 *
 * Privy embedded wallet creation is async — after Google/email login,
 * the wallet may take a few seconds to appear in useWallets().
 * We also check user.wallet as a fallback for the address.
 */
export function useAuth() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Find both wallet types from live wallets array
  const embedded = useMemo(
    () => wallets.find((w) => w.walletClientType === 'privy') ?? null,
    [wallets],
  );
  const external = useMemo(
    () => wallets.find((w) => w.walletClientType !== 'privy') ?? null,
    [wallets],
  );

  // Use external wallet if available (MetaMask/Coinbase login),
  // otherwise fall back to Privy embedded wallet (email/Google login)
  const activeWallet = external ?? embedded;

  // Wallet address: try live wallet first, then fallback to user.wallet
  // (user.wallet is available before useWallets() populates)
  const walletAddress = useMemo(() => {
    if (!user) return null;
    if (activeWallet?.address) return activeWallet.address;
    // Fallback: Privy user object has wallet info before useWallets() is ready
    const privyWallet = (user as any).wallet;
    return privyWallet?.address ?? null;
  }, [user, activeWallet]);

  // True when using MetaMask/Coinbase — TX will show popup
  const isExternalWallet = !!external;

  // Wallet is fully ready for transactions (activeWallet available)
  const walletReady = !!(walletAddress && activeWallet);

  return {
    ready,
    authenticated,
    user,
    walletAddress,
    activeWallet,
    isExternalWallet,
    walletReady,
    wallets,
    login,
    logout,
  };
}
