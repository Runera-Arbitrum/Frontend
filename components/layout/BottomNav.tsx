'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, MapPin, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabRoute } from '@/lib/types';

interface NavItem {
  route: TabRoute;
  href: string;
  label: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { route: 'home', href: '/home', label: 'Home', icon: Home },
  { route: 'events', href: '/events', label: 'Events', icon: Calendar },
  { route: 'record', href: '/record', label: 'Record', icon: MapPin },
  { route: 'market', href: '/market', label: 'Market', icon: ShoppingBag },
  { route: 'profile', href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-surface border-t border-border-light shadow-bottom-nav z-40">
      <div className="flex items-center justify-around h-16 pb-[var(--spacing-safe-bottom)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isRecord = item.route === 'record';
          const Icon = item.icon;

          // Record button gets special center treatment
          if (isRecord) {
            return (
              <Link
                key={item.route}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary scale-110'
                    : 'bg-primary hover:scale-105',
                )}>
                  <Icon size={24} className="text-text-inverse" strokeWidth={2.5} />
                </div>
                <span className={cn(
                  'text-[10px] mt-1 font-medium',
                  isActive ? 'text-primary' : 'text-text-tertiary',
                )}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.route}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-3"
            >
              <Icon
                size={22}
                className={cn(
                  'transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-text-tertiary',
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                'text-[10px] font-medium transition-colors duration-150',
                isActive ? 'text-primary' : 'text-text-tertiary',
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
