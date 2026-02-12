'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { arbitrumSepolia } from 'viem/chains';
import { PRIVY_APP_ID } from '@/lib/constants';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        defaultChain: arbitrumSepolia,
        supportedChains: [arbitrumSepolia],
        appearance: {
          theme: 'light',
          accentColor: '#2563EB',
          logo: '/runera-logo.svg',
        },
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
