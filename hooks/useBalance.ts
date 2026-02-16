'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, http, type Address, formatEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { RPC_URL } from '@/lib/constants';

/**
 * Hook to fetch user's ETH balance on Arbitrum Sepolia
 */
export function useBalance(address?: string | null) {
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setBalance('0');
      setIsLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const client = createPublicClient({
          chain: arbitrumSepolia,
          transport: http(RPC_URL),
        });

        const balanceWei = await client.getBalance({
          address: address as Address,
        });

        // Convert from wei to ETH
        const balanceEth = formatEther(balanceWei);

        // Format to 4 decimal places
        const formatted = parseFloat(balanceEth).toFixed(4);
        setBalance(formatted);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, [address]);

  return { balance, isLoading };
}
