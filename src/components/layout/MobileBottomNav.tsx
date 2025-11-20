"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUnreadNotificationCountAction } from '@/lib/actions/notifications';
import { useEffect, useState } from 'react';

interface MobileBottomNavProps {
  user: {
    id: string;
    username: string;
  } | null;
  initialUnreadCount?: number;
}

export function MobileBottomNav({ user, initialUnreadCount = 0 }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  // Poll for notification updates
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(async () => {
      try {
        const result = await getUnreadNotificationCountAction();
        if (result.success && typeof result.data === 'number') {
          setUnreadCount(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  const navItems = [
    {
      id: 'home',
      href: '/',
      label: 'Home',
      icon: Home,
      show: true,
    },
    {
      id: 'categories',
      href: '/#categories',
      label: 'Categories',
      icon: LayoutGrid,
      show: true,
    },
    {
      id: 'profile',
      href: user ? `/users/${user.username}` : '/login',
      label: 'Profile',
      icon: User,
      show: true,
    },
    {
      id: 'notifications',
      href: user ? '/notifications' : '/login',
      label: 'Notifications',
      icon: Bell,
      show: true,
      badge: user ? unreadCount : undefined,
    },
  ];

  // Only show on mobile
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border md:hidden">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href === '/' && pathname === '/') ||
              (item.href.startsWith('/users/') && pathname.startsWith('/users/')) ||
              (item.href === '/notifications' && pathname === '/notifications');
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

