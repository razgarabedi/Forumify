
"use client";

import React from 'react'; // Added React import
import type { Notification } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, CheckCircle2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { markNotificationReadAction } from '@/lib/actions/notifications';
import { cn } from '@/lib/utils';
import { useActionState } from 'react';

interface NotificationItemProps {
  notification: Notification;
}

const initialActionState = { success: false, message: '' };

export function NotificationItem({ notification }: NotificationItemProps) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(markNotificationReadAction.bind(null, notification.id), initialActionState);


  const handleMarkAsRead = async () => {
    if (notification.isRead) return;
    // Trigger the server action via formAction
    formAction();
  };

  // Use useEffect to react to state changes from useActionState
  React.useEffect(() => {
    if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
    // No success toast needed here as the UI will update implicitly (becomes read)
    // and revalidation is handled by the action.
  }, [state, toast]);

  return (
    <Card className={cn("mb-3 shadow-sm border", notification.isRead ? "border-border/50 bg-card/70" : "border-primary/30 bg-primary/5")}>
      <CardHeader className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
            <div>
                <CardTitle className="text-sm sm:text-base font-medium flex items-center">
                    <BellRing className={cn("h-4 w-4 mr-2 flex-shrink-0", notification.isRead ? "text-muted-foreground" : "text-primary")} />
                    New Mention
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </CardDescription>
            </div>
            {!notification.isRead && (
                 <form action={formAction}>
                    <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        disabled={isPending}
                        aria-label="Mark as read"
                    >
                        {isPending ? 'Marking...' : <><Eye className="mr-1 h-3.5 w-3.5" /> Mark as Read</>}
                    </Button>
                 </form>
            )}
            {notification.isRead && (
                 <span className="text-xs text-muted-foreground flex items-center">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-500" /> Read
                 </span>
            )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 text-sm">
        <p className="text-foreground">
          <Link href={`/users/${notification.mentionerUsername}`} className="font-semibold text-primary hover:underline">
            {notification.mentionerUsername}
          </Link>
          {' mentioned you in the topic: '}
          <Link href={`/topics/${notification.topicId}#post-${notification.postId}`} className="font-semibold text-primary hover:underline">
            {notification.topicTitle}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
