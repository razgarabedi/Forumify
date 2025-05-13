
"use client";

import type { ConversationListItem } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ConversationListClientProps {
  initialConversations: ConversationListItem[];
  currentUserId: string; 
}

export function ConversationListClient({ initialConversations, currentUserId }: ConversationListClientProps) {

  return (
    <div className="space-y-3">
      {initialConversations.map((convo) => (
        <Link href={`/messages/${convo.id}`} key={convo.id} className="block group">
          <Card className={cn(
            "hover:shadow-md transition-shadow duration-150 ease-in-out border",
            convo.unreadCount > 0 ? "border-primary/50 bg-primary/5 hover:bg-primary/10" : "border-border hover:bg-muted/50"
          )}>
            <CardHeader className="p-3 sm:p-4 flex flex-row items-center space-x-3">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={convo.otherParticipant.avatarUrl || `https://avatar.vercel.sh/${convo.otherParticipant.username}.png?size=40`} alt={convo.otherParticipant.username} data-ai-hint="user avatar"/>
                <AvatarFallback>{convo.otherParticipant.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold group-hover:text-primary">
                  {convo.otherParticipant.username}
                </CardTitle>
                {convo.subject && (
                    <p className="text-sm font-semibold text-foreground/80 truncate mt-0.5" title={convo.subject}>
                        {convo.subject}
                    </p>
                )}
                <CardDescription className={cn("text-xs text-muted-foreground truncate", convo.subject ? "mt-0.5" : "mt-1")}>
                  {convo.isLastMessageFromCurrentUser && "You: "}
                  {convo.lastMessageSnippet}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end text-xs text-muted-foreground ml-auto pl-2">
                <span>{formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true })}</span>
                {convo.unreadCount > 0 && (
                  <span className="mt-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-primary-foreground bg-primary rounded-full">
                    {convo.unreadCount}
                  </span>
                )}
              </div>
               <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-in-out" />
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

