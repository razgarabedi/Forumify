"use client"; // Required for useState and handlers

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Post as PostType, User } from '@/lib/types';
import { Post } from '@/components/forums/Post';
import { PostForm } from '@/components/forms/PostForm'; // Import PostForm for editing
import { PostFormMobile } from '@/components/forms/PostFormMobile'; // Import PostFormMobile for mobile editing
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getPostsByTopic } from '@/lib/actions/forums';

interface PostListProps {
    initialPosts: PostType[];
    topicId: string;
    currentUser: User | null;
}

const POSTS_PER_PAGE = 20;

export function PostList({ initialPosts, topicId, currentUser }: PostListProps) {
    const [allPosts, setAllPosts] = useState<PostType[]>(initialPosts);
    const [editingPost, setEditingPost] = useState<PostType | null>(null);
    const [displayedPosts, setDisplayedPosts] = useState<PostType[]>(allPosts.slice(0, POSTS_PER_PAGE));
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(allPosts.length > POSTS_PER_PAGE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Update displayed posts when allPosts changes
    useEffect(() => {
        setDisplayedPosts(prev => {
            // If we haven't loaded a full page yet, show all available posts up to POSTS_PER_PAGE
            if (prev.length < POSTS_PER_PAGE) {
                return allPosts.slice(0, Math.min(POSTS_PER_PAGE, allPosts.length));
            }
            // If we've loaded more, keep showing what we have but update the list with current posts
            const updated = allPosts.slice(0, prev.length);
            return updated.length > 0 ? updated : allPosts.slice(0, POSTS_PER_PAGE);
        });
        setHasMore(allPosts.length > displayedPosts.length);
    }, [allPosts]);

    // Infinite scroll with Intersection Observer
    useEffect(() => {
        if (!hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMorePosts();
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

    const loadMorePosts = useCallback(() => {
        if (isLoading || !hasMore) return;
        
        setIsLoading(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            const currentLength = displayedPosts.length;
            const nextPosts = allPosts.slice(currentLength, currentLength + POSTS_PER_PAGE);
            setDisplayedPosts(prev => [...prev, ...nextPosts]);
            setHasMore(currentLength + POSTS_PER_PAGE < allPosts.length);
            setIsLoading(false);
        }, 300);
    }, [displayedPosts.length, allPosts, isLoading, hasMore]);

    // Handle post deletion - remove from state immediately
    const handlePostDeleted = useCallback((deletedPostId: string) => {
        setAllPosts(prev => prev.filter(p => p.id !== deletedPostId));
        setDisplayedPosts(prev => prev.filter(p => p.id !== deletedPostId));
    }, []);

    // Handle new post added - add to state immediately
    const handlePostAdded = useCallback(async (newPost?: PostType) => {
        if (newPost) {
            // Add the new post to the list
            setAllPosts(prev => [...prev, newPost]);
            // Always add to displayed if we're showing all or near all posts
            setDisplayedPosts(prev => {
                // If we're showing all posts (or close to it), add the new one
                if (prev.length >= allPosts.length || prev.length < POSTS_PER_PAGE) {
                    return [...prev, newPost];
                }
                return prev;
            });
        } else {
            // Fallback: fetch all posts if newPost not provided
            try {
                const updatedPosts = await getPostsByTopic(topicId);
                setAllPosts(updatedPosts);
            } catch (error) {
                console.error('Failed to refresh posts:', error);
            }
        }
    }, [topicId, allPosts.length]);

    // Handle post updated - update in state
    const handlePostUpdated = useCallback((updatedPost: PostType) => {
        setAllPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        setDisplayedPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    }, []);

    if (!allPosts || allPosts.length === 0) {
        return <p className="text-muted-foreground mt-6 text-center py-10">No posts found in this topic yet.</p>;
    }

    const handleEdit = (post: PostType) => {
        setEditingPost(post);
        // Scroll to the PostForm when editing starts
        const formElement = document.getElementById('post-form-container') || document.getElementById('post-form-container-mobile');
        formElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleCancelEdit = () => {
        setEditingPost(null);
    };

    return (
        <div className="space-y-4">
            {displayedPosts.map((post, index) => (
                // Conditionally render Post or PostForm based on editing state
                editingPost?.id === post.id ? (
                    <>
                        <div id="post-form-container" key={`edit-${post.id}`} className="hidden md:block">
                            <PostForm
                                topicId={topicId}
                                editingPost={editingPost}
                                onEditCancel={handleCancelEdit}
                                onPostUpdated={handlePostUpdated}
                            />
                        </div>
                        <div id="post-form-container-mobile" key={`edit-mobile-${post.id}`} className="block md:hidden">
                            <PostFormMobile
                                topicId={topicId}
                                editingPost={editingPost}
                                onEditCancel={handleCancelEdit}
                                onPostUpdated={handlePostUpdated}
                            />
                        </div>
                    </>
                ) : (
                    <Post
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onEdit={handleEdit}
                        onDelete={handlePostDeleted}
                        isFirstPost={index === 0}
                    />
                )
            ))}
            
            {/* Post Forms - Pass callbacks for adding/updating posts - Only show if user is logged in */}
            {currentUser && (
                <>
                    <div id="post-form-container" className="hidden md:block">
                        <PostForm 
                            topicId={topicId} 
                            onPostAdded={handlePostAdded}
                            onPostUpdated={handlePostUpdated}
                        />
                    </div>
                    <div id="post-form-container-mobile" className="block md:hidden">
                        <PostFormMobile 
                            topicId={topicId} 
                            onPostAdded={handlePostAdded}
                            onPostUpdated={handlePostUpdated}
                        />
                    </div>
                </>
            )}
            
            {/* Infinite Scroll Trigger & Load More Button */}
            {hasMore && (
                <div ref={loadMoreRef} className="flex flex-col items-center gap-4 py-6">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading more posts...</span>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={loadMorePosts}
                            className="w-full sm:w-auto"
                        >
                            Load More Posts ({allPosts.length - displayedPosts.length} remaining)
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
