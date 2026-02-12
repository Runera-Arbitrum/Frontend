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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 flex justify-center pb-3 pointer-events-none">
      <nav
        className="pointer-events-auto rounded-[41px] px-3"
        style={{
          width: 280,
          height: 52,
          background: 'rgba(255, 255, 255, 0.81)',
          border: '0.9px solid rgba(0, 0, 0, 0.11)',
          boxShadow: '0px 1.2px 4.9px 0.6px rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(4.4px)',
          WebkitBackdropFilter: 'blur(4.4px)',
        }}
      >
        <div className="flex items-center justify-around h-full">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.route}
                href={item.href}
                className="flex items-center justify-center"
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive ? 'bg-[#0072F4]' : '',
                )}>
                  <Icon
                    size={20}
                    className={cn(
                      'transition-all duration-200',
                      isActive ? 'text-white' : 'text-[#8893A2]',
                    )}
                    strokeWidth={isActive ? 2.2 : 1.8}
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
