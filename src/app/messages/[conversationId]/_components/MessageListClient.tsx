
"use client";

import type { PrivateMessageDisplay } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { triggerMessageRevalidationAction } from '@/lib/actions/privateMessages';

interface MessageListClientProps {
  initialMessages: PrivateMessageDisplay[];
  currentUserId: string;
  conversationId: string; // Add conversationId as a prop
}

export function MessageListClient({ initialMessages, currentUserId, conversationId }: MessageListClientProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Scroll to bottom when messages change or on initial load
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [initialMessages]);

  // Trigger revalidation after messages are loaded and potentially marked as read on the server.
  // This ensures UI elements like unread counts in the header/conversation list are updated.
  useEffect(() => {
    if (conversationId) {
      triggerMessageRevalidationAction(conversationId)
        .catch(err => console.error("Failed to trigger message revalidation:", err));
    }
  }, [conversationId]); // Re-run if conversationId changes


  if (initialMessages.length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-muted-foreground">No messages in this conversation yet. Send one to start!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-2 sm:p-4" viewportRef={viewportRef} ref={scrollAreaRef}>
      <div className="space-y-4">
        {initialMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-2 max-w-[85%] sm:max-w-[75%]",
              msg.isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {!msg.isOwnMessage && (
              <Avatar className="h-8 w-8 border self-start flex-shrink-0">
                 <AvatarImage src={msg.sender.avatarUrl || `https://avatar.vercel.sh/${msg.sender.username}.png?size=32`} alt={msg.sender.username} data-ai-hint="user avatar"/>
                <AvatarFallback>{msg.sender.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "p-2.5 sm:p-3 rounded-lg shadow-sm text-sm break-words",
                msg.isOwnMessage
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-foreground rounded-bl-none"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={cn(
                  "text-xs mt-1.5",
                   msg.isOwnMessage ? "text-primary-foreground/70 text-right" : "text-muted-foreground/80 text-left"
                )}>
                {format(new Date(msg.createdAt), 'p')} {/* e.g., 2:30 PM */}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

