"use client";

import Link from 'next/link';
import type { Topic } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PinTopicButton } from './PinTopicButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, UserCircle, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

interface TopicCardProps {
  topic: Topic;
  canPin: boolean;
  siteSettings: {
    seo_friendly_urls_enabled: boolean;
  };
}

export function TopicCard({ topic, canPin, siteSettings }: TopicCardProps) {
  const [optimisticPinned, setOptimisticPinned] = useState(topic.pinned);

  // Update local state when topic.pinned changes (e.g., after server revalidation)
  useEffect(() => {
    setOptimisticPinned(topic.pinned);
  }, [topic.pinned]);

  const handlePinChange = (newPinned: boolean) => {
    setOptimisticPinned(newPinned);
  };

  return (
    <div className="group transition-all duration-200 ease-in-out transform hover:-translate-y-0.5">
      <Card className={`hover:shadow-lg transition-shadow duration-200 border ${optimisticPinned ? 'border-accent ring-1 ring-accent/60 bg-accent/5' : 'border-border'} hover:border-primary/60 bg-card hover:bg-muted/50`}>
        <CardHeader className="flex flex-row items-start space-x-3 p-4">
          <Link href={`/users/${topic.author?.username}`} className="flex-shrink-0 block" title={`View ${topic.author?.username}'s profile`}>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={topic.author?.avatarUrl || `https://avatar.vercel.sh/${topic.author?.username || topic.authorId}.png?size=40`} alt={topic.author?.username} data-ai-hint="user avatar"/>
              <AvatarFallback>{topic.author?.username?.charAt(0)?.toUpperCase() || 'T'}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium leading-snug line-clamp-2 flex items-center gap-2">
              {optimisticPinned && (
                <span title="Pinned topic" className="inline-flex items-center text-accent">
                  <Pin className="h-4 w-4" />
                </span>
              )}
              <Link href={`/topics/${siteSettings.seo_friendly_urls_enabled ? (topic.slug || '') : topic.id}`} className="group-hover:text-primary">
                {topic.title}
              </Link>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
              <UserCircle className="h-3 w-3" />
              <Link href={`/users/${topic.author?.username}`} className="hover:underline" title={`View ${topic.author?.username}'s profile`}>
                <span>{topic.author?.username || 'Unknown'}</span>
              </Link>
              <span className="mx-1">·</span>
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
            </CardDescription>
          </div>
          {canPin && (
            <div className="ml-auto">
              <PinTopicButton 
                topicId={topic.id} 
                isPinned={optimisticPinned}
                onPinChange={handlePinChange}
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground flex flex-wrap justify-between items-center gap-x-4 gap-y-1 p-4 pt-0 pl-16">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {topic.postCount ?? 0} Posts
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Last activity {formatDistanceToNow(new Date(topic.lastActivityAt || topic.createdAt), { addSuffix: true })}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
