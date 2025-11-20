"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Topic } from '@/lib/types';
import { TopicCard } from './TopicCard';
import { TopicCardMobile } from './TopicCardMobile';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TopicListProps {
    topics: Topic[];
    canPin: boolean;
    siteSettings: {
        seo_friendly_urls_enabled: boolean;
    };
}

const TOPICS_PER_PAGE = 15;

export function TopicList({ topics, canPin, siteSettings }: TopicListProps) {
    const [displayedTopics, setDisplayedTopics] = useState<Topic[]>(topics.slice(0, TOPICS_PER_PAGE));
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(topics.length > TOPICS_PER_PAGE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Infinite scroll with Intersection Observer
    useEffect(() => {
        if (!hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMoreTopics();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasMore, isLoading]);

    const loadMoreTopics = useCallback(() => {
        if (isLoading || !hasMore) return;
        
        setIsLoading(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            const currentLength = displayedTopics.length;
            const nextTopics = topics.slice(currentLength, currentLength + TOPICS_PER_PAGE);
            setDisplayedTopics(prev => [...prev, ...nextTopics]);
            setHasMore(currentLength + TOPICS_PER_PAGE < topics.length);
            setIsLoading(false);
        }, 300);
    }, [displayedTopics.length, topics, isLoading, hasMore]);

    if (!topics || topics.length === 0) {
        return <p className="text-muted-foreground mt-6 text-center py-10">No topics found in this category yet.</p>;
    }

    return (
        <div className="space-y-3">
            {displayedTopics.map((topic) => (
                <div key={topic.id} className="hidden md:block">
                    <TopicCard 
                        topic={topic} 
                        canPin={canPin} 
                        siteSettings={siteSettings} 
                    />
                </div>
            ))}
            {displayedTopics.map((topic) => (
                <div key={`mobile-${topic.id}`} className="block md:hidden">
                    <TopicCardMobile 
                        topic={topic} 
                        canPin={canPin} 
                        siteSettings={siteSettings} 
                    />
                </div>
            ))}
            
            {/* Infinite Scroll Trigger & Load More Button */}
            {hasMore && (
                <div ref={loadMoreRef} className="flex flex-col items-center gap-4 py-6">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading more topics...</span>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={loadMoreTopics}
                            className="w-full sm:w-auto"
                        >
                            Load More Topics ({topics.length - displayedTopics.length} remaining)
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}