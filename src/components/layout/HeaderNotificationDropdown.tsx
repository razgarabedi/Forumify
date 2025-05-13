
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Notification, User } from '@/lib/types';
import { fetchNotificationsAction, markNotificationReadAction, getUnreadNotificationCountAction } from '@/lib/actions/notifications';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface HeaderNotificationDropdownProps {
  user: User | null;
  initialUnreadCount: number;
}

const MAX_NOTIFICATIONS_IN_DROPDOWN = 5;

export function HeaderNotificationDropdown({ user, initialUnreadCount }: HeaderNotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      fetchNotificationsAction()
        .then(data => {
          setNotifications(data.slice(0, MAX_NOTIFICATIONS_IN_DROPDOWN));
          // Update unread count based on fetched data in case it changed
          const currentUnread = data.filter(n => !n.isRead).length;
          setUnreadCount(currentUnread);
        })
        .catch(error => {
          console.error("Failed to fetch notifications:", error);
          toast({ title: "Error", description: "Could not load notifications.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user, toast]);
  
  // Effect to poll for unread count periodically - simple polling example
  // In a real app, WebSockets or server-sent events would be better.
  useEffect(() => {
    if (!user) return;
    const intervalId = setInterval(async () => {
      try {
        const count = await getUnreadNotificationCountAction();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to poll unread notification count:", error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [user]);


  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        const result = await markNotificationReadAction(notification.id);
        if (result.success) {
          setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
          toast({ title: "Error", description: result.message || "Could not mark as read.", variant: "destructive" });
        }
      } catch (e) {
         toast({ title: "Error", description: "Could not mark as read.", variant: "destructive" });
      }
    }
    router.push(`/topics/${notification.topicId}#post-${notification.postId}`);
    setIsOpen(false); // Close dropdown after click
  };

  if (!user) {
    return null; // Don't render anything if no user
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
              {/* Small dot for count > 0, or show count if design allows */}
               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
               <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Recent Notifications</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 && !isLoading && (
          <DropdownMenuItem disabled className="text-center text-muted-foreground py-4">
            No new notifications.
          </DropdownMenuItem>
        )}
        {notifications.map(notif => (
          <DropdownMenuItem
            key={notif.id}
            onSelect={(e) => { e.preventDefault(); handleNotificationClick(notif); }}
            className={cn(
              "flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/80",
              !notif.isRead && "bg-primary/5 hover:bg-primary/10"
            )}
          >
            <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
              <AvatarImage src={`https://avatar.vercel.sh/${notif.mentionerUsername}.png?size=32`} alt={notif.mentionerUsername} data-ai-hint="user avatar" />
              <AvatarFallback>{notif.mentionerUsername.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{notif.mentionerUsername}</span>
                {' mentioned you in "'}
                <span className="truncate font-medium text-primary">{notif.topicTitle}</span>
                {'"'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
              </p>
            </div>
            {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary self-center flex-shrink-0 ml-2"></div>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { router.push('/notifications'); setIsOpen(false);}} className="justify-center text-sm text-primary hover:underline p-2">
          <CheckCheck className="mr-2 h-4 w-4" /> View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
