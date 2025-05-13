
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink, Loader2, MessageSquare, ThumbsUp, Heart, Laugh, SmilePlus, Frown, Angry } from 'lucide-react';
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
import type { Notification, User, ReactionType } from '@/lib/types';
import { fetchNotificationsAction, markNotificationReadAction, getUnreadNotificationCountAction } from '@/lib/actions/notifications';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface HeaderNotificationDropdownProps {
  user: User | null;
  initialUnreadCount: number;
}

const MAX_NOTIFICATIONS_IN_DROPDOWN = 5;

const reactionIcons: Record<ReactionType, React.ElementType> = {
  like: ThumbsUp,
  love: Heart,
  haha: Laugh,
  wow: SmilePlus,
  sad: Frown,
  angry: Angry,
};


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
  
  useEffect(() => {
    if (!user) return;
    const intervalId = setInterval(async () => {
      try {
        const count = await getUnreadNotificationCountAction();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to poll unread notification count:", error);
      }
    }, 30000); 

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
    
    if (notification.type === 'private_message' && notification.conversationId) {
      router.push(`/messages/${notification.conversationId}`);
    } else if ((notification.type === 'mention' || notification.type === 'reaction') && notification.topicId && notification.postId) {
      router.push(`/topics/${notification.topicId}#post-${notification.postId}`);
    } else {
      console.warn("HeaderNotificationDropdown: Could not determine navigation path for notification:", notification);
    }
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  const getNotificationText = (notif: Notification) => {
    if (notif.type === 'private_message') {
      return (
        <>
          <span className="font-semibold">{notif.senderUsername}</span>
          {' sent you a private message.'}
          {notif.message && <span className="block text-xs text-muted-foreground italic truncate">"{notif.message}"</span>}
        </>
      );
    }
    if (notif.type === 'reaction' && notif.reactionType) {
      return (
        <>
          <span className="font-semibold">{notif.senderUsername}</span>
          {` reacted with ${notif.reactionType} to "`}
          <span className="truncate font-medium text-primary">{notif.topicTitle || 'your post'}</span>
          {'"'}
        </>
      );
    }
    // Default to mention
    return (
      <>
        <span className="font-semibold">{notif.senderUsername}</span>
        {' mentioned you in "'}
        <span className="truncate font-medium text-primary">{notif.topicTitle || 'a topic'}</span>
        {'"'}
      </>
    );
  };
  
  const getNotificationIcon = (notif: Notification) => {
    if (notif.type === 'private_message') {
        return <MessageSquare className="h-4 w-4 text-primary" />;
    }
    if (notif.type === 'reaction' && notif.reactionType) {
        const ReactionIcon = reactionIcons[notif.reactionType] || ThumbsUp; // Fallback to ThumbsUp
        return <ReactionIcon className="h-4 w-4 text-primary" />;
    }
    return <Bell className="h-4 w-4 text-primary" />;
  };


  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
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
            <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notif)}
            </div>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={`https://avatar.vercel.sh/${notif.senderUsername}.png?size=32`} alt={notif.senderUsername} data-ai-hint="user avatar" />
              <AvatarFallback>{notif.senderUsername.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
              <p className="text-sm">
                {getNotificationText(notif)}
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
