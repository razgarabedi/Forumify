"use client"; // Required for useState and handlers

import React, { useState } from 'react';
import type { Post as PostType, User } from '@/lib/types';
import { Post } from '@/components/forums/Post';
import { PostForm } from '@/components/forms/PostForm'; // Import PostForm for editing

interface PostListProps {
    initialPosts: PostType[];
    topicId: string;
    currentUser: User | null;
}

export function PostList({ initialPosts, topicId, currentUser }: PostListProps) {
    const [editingPost, setEditingPost] = useState<PostType | null>(null);

    // This component doesn't fetch, it receives initial posts.
    // Real-time updates would require client-side fetching or subscriptions.

     if (!initialPosts || initialPosts.length === 0) {
        return <p className="text-muted-foreground mt-6">No posts found in this topic yet.</p>;
    }

     const handleEdit = (post: PostType) => {
        setEditingPost(post);
        // Scroll to the PostForm when editing starts
        const formElement = document.getElementById('post-form-container');
        formElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

     const handleCancelEdit = () => {
        setEditingPost(null);
    };


    return (
        <div className="space-y-4">
             {initialPosts.map((post) => (
                // Conditionally render Post or PostForm based on editing state
                editingPost?.id === post.id ? (
                     <div id="post-form-container" key={`edit-${post.id}`}> {/* Container for edit form */}
                        <PostForm
                            topicId={topicId}
                            editingPost={editingPost}
                            onEditCancel={handleCancelEdit}
                        />
                    </div>
                ) : (
                     <Post
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onEdit={handleEdit} // Pass edit handler
                    />
                )
            ))}
        </div>
    );
}
