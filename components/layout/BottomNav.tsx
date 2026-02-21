'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarHeart, Footprints, ShoppingBag, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabRoute } from '@/lib/types';

interface NavItem {
  route: TabRoute;
  href: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { route: 'home', href: '/home', icon: Home },
  { route: 'events', href: '/events', icon: CalendarHeart },
  { route: 'record', href: '/record', icon: Footprints },
  { route: 'market', href: '/market', icon: ShoppingBag },
  { route: 'profile', href: '/profile', icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '8px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: '#ffffff',
      }}
    >
      <nav
        style={{
          width: '280px',
          height: '52px',
          background: 'rgba(255, 255, 255, 0.81)',
          border: '0.9px solid rgba(0, 0, 0, 0.11)',
          boxShadow: '0px 1.2px 4.9px 0.6px rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(4.4px)',
          WebkitBackdropFilter: 'blur(4.4px)',
          borderRadius: '41px',
          padding: '0 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.route}
                href={item.href}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? '#0072F4' : 'transparent',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <Icon
                    size={22}
                    color={isActive ? '#ffffff' : '#8893A2'}
                    strokeWidth={isActive ? 2.3 : 1.9}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
