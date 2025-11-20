"use client";

import Link from 'next/link';
import type { Topic } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, UserCircle, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { getPostsByTopic } from '@/lib/actions/forums';
import type { Post } from '@/lib/types';

interface TopicCardMobileProps {
  topic: Topic;
  canPin: boolean;
  siteSettings: {
    seo_friendly_urls_enabled: boolean;
  };
}

export function TopicCardMobile({ topic, canPin, siteSettings }: TopicCardMobileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleExpand = async () => {
    if (!isExpanded && recentPosts.length === 0) {
      setIsLoading(true);
      try {
        const posts = await getPostsByTopic(topic.id);
        // Get last 3 posts (excluding first post)
        const replies = posts.slice(1).slice(-3);
        setRecentPosts(replies);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="border-border hover:border-primary/60 bg-card transition-all">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <Link href={`/users/${topic.author?.username}`} className="flex-shrink-0 block" title={`View ${topic.author?.username}'s profile`}>
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border">
              <AvatarImage src={topic.author?.avatarUrl || `https://avatar.vercel.sh/${topic.author?.username || topic.authorId}.png?size=40`} alt={topic.author?.username} />
              <AvatarFallback>{topic.author?.username?.charAt(0)?.toUpperCase() || 'T'}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base font-medium leading-snug line-clamp-2 flex items-center gap-2">
              {topic.pinned && (
                <span title="Pinned topic" className="inline-flex items-center text-accent flex-shrink-0">
                  <Pin className="h-3 w-3 sm:h-4 sm:w-4" />
                </span>
              )}
              <Link 
                href={`/topics/${siteSettings.seo_friendly_urls_enabled ? (topic.slug || '') : topic.id}`}
                className="hover:text-primary transition-colors"
              >
                {topic.title}
              </Link>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
              <UserCircle className="h-3 w-3" />
              <Link href={`/users/${topic.author?.username}`} className="hover:underline">
                <span>{topic.author?.username || 'Unknown'}</span>
              </Link>
              <span className="mx-1">·</span>
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
            </CardDescription>
          </div>
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap justify-between items-center gap-x-4 gap-y-1 mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {topic.postCount ?? 0} Posts
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Last activity {formatDistanceToNow(new Date(topic.lastActivityAt || topic.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </CardHeader>
      
      {/* Expandable Replies Section */}
      {topic.postCount > 1 && (
        <>
          <Button
            variant="ghost"
            className="w-full rounded-none border-t border-border/50 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleExpand}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide Replies
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                View Recent Replies ({topic.postCount - 1})
              </>
            )}
          </Button>
          {isExpanded && (
            <CardContent className="pt-3 pb-3 px-3 sm:px-4 bg-muted/30 animate-in slide-in-from-top-2 duration-200">
              {isLoading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">Loading replies...</div>
              ) : recentPosts.length > 0 ? (
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="flex gap-2 text-xs">
                      <Link href={`/users/${post.author?.username}`} className="flex-shrink-0">
                        <Avatar className="h-6 w-6 border">
                          <AvatarImage src={post.author?.avatarUrl || `https://avatar.vercel.sh/${post.author?.username}.png?size=24`} />
                          <AvatarFallback className="text-[10px]">{post.author?.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <Link href={`/users/${post.author?.username}`} className="font-medium hover:underline">
                            {post.author?.username}
                          </Link>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">
                          {post.content.replace(/[#*`_~\[\]()]/g, '').substring(0, 100)}
                          {post.content.length > 100 ? '...' : ''}
                        </p>
                        <Link 
                          href={`/topics/${siteSettings.seo_friendly_urls_enabled ? (topic.slug || '') : topic.id}#post-${post.id}`}
                          className="text-primary hover:underline text-[10px] mt-1 inline-block"
                        >
                          View full post →
                        </Link>
                      </div>
                    </div>
                  ))}
                  <Link
                    href={`/topics/${siteSettings.seo_friendly_urls_enabled ? (topic.slug || '') : topic.id}`}
                    className="block text-center text-xs text-primary hover:underline pt-2 border-t border-border/50"
                  >
                    View all {topic.postCount} posts →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">No replies yet</div>
              )}
            </CardContent>
          )}
        </>
      )}
    </Card>
  );
}

