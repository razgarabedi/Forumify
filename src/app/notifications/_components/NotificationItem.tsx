
"use client";

import React from 'react';
import type { Notification } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, CheckCircle2, Eye, ExternalLink, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { markNotificationReadAction } from '@/lib/actions/notifications';
import { cn } from '@/lib/utils';
import { useActionState } from 'react';

interface NotificationItemProps {
  notification: Notification;
}

const initialActionStateForButton = { success: false, message: '' };

export function NotificationItem({ notification }: NotificationItemProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [buttonState, buttonFormAction, isButtonPending] = useActionState(markNotificationReadAction.bind(null, notification.id), initialActionStateForButton);

  const handleItemClick = async () => {
    if (!notification.isRead) {
      const result = await markNotificationReadAction(notification.id);
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message || "Could not mark notification as read.",
        });
      }
    }
    if (notification.type === 'private_message' && notification.conversationId) {
      router.push(`/messages/${notification.conversationId}`);
    } else if (notification.type === 'mention' && notification.topicId && notification.postId) {
      router.push(`/topics/${notification.topicId}#post-${notification.postId}`);
    } else {
        console.warn("NotificationItem: Could not determine navigation path for notification:", notification);
    }
  };

  React.useEffect(() => {
    if (buttonState.message && !buttonState.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: buttonState.message,
      });
    }
  }, [buttonState, toast]);

  const getNotificationTitle = () => {
    if (notification.type === 'private_message') {
      return "New Private Message";
    }
    return "New Mention";
  };

  const getNotificationIcon = () => {
    if (notification.type === 'private_message') {
      return <MessageSquare className={cn("h-4 w-4 mr-2 flex-shrink-0", notification.isRead ? "text-muted-foreground" : "text-primary")} />;
    }
    return <BellRing className={cn("h-4 w-4 mr-2 flex-shrink-0", notification.isRead ? "text-muted-foreground" : "text-primary")} />;
  };
  
  const getNotificationContent = () => {
    if (notification.type === 'private_message') {
      return (
        <>
          <span className="font-semibold text-primary group-hover:underline">
            {notification.senderUsername}
          </span>
          {' sent you a private message.'}
          {notification.message && <span className="block text-xs text-muted-foreground italic mt-1">"{notification.message}"</span>}
        </>
      );
    }
    // Default to mention
    return (
      <>
        <span className="font-semibold text-primary group-hover:underline">
          {notification.senderUsername}
        </span>
        {' mentioned you in the topic: '}
        <span className="font-semibold text-primary group-hover:underline">
          {notification.topicTitle || 'a topic'}
        </span>
      </>
    );
  };


  return (
    <Card 
      className={cn(
        "mb-3 shadow-sm border transition-colors duration-150 ease-in-out group", 
        notification.isRead ? "border-border/50 bg-card/70 hover:bg-muted/50" : "border-primary/30 bg-primary/5 hover:bg-primary/10",
        "cursor-pointer"
      )}
      onClick={handleItemClick}
    >
      <CardHeader className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
            <div>
                <CardTitle className="text-sm sm:text-base font-medium flex items-center">
                    {getNotificationIcon()}
                    {getNotificationTitle()}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </CardDescription>
            </div>
            {!notification.isRead && (
                 <form action={buttonFormAction} onClick={(e) => e.stopPropagation()} >
                    <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-xs opacity-70 group-hover:opacity-100 transition-opacity"
                        disabled={isButtonPending}
                        aria-label="Mark as read"
                    >
                        {isButtonPending ? 'Marking...' : <><Eye className="mr-1 h-3.5 w-3.5" /> Mark as Read</>}
                    </Button>
                 </form>
            )}
            {notification.isRead && (
                 <span className="text-xs text-muted-foreground flex items-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-500" /> Read
                 </span>
            )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 text-sm">
        <p className="text-foreground">
          {getNotificationContent()}
           <ExternalLink className="inline-block h-3 w-3 ml-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </p>
      </CardContent>
    </Card>
  );
}

