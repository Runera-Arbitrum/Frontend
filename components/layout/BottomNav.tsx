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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 flex justify-center ios-bottom-nav-safe pointer-events-none">
      <nav
        className="pointer-events-auto rounded-[41px] px-3 glass-ios-nav"
        style={{
          width: 280,
          height: 52,
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
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ios-press',
                  isActive ? 'bg-[#0072F4]' : '',
                )}>
                  <Icon
                    size={22}
                    className={cn(
                      'transition-all duration-200',
                      isActive ? 'text-white' : 'text-[#8893A2]',
                    )}
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
