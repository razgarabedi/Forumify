
"use client"; 

import type { Post as PostType, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card'; // Removed CardHeader, CardDescription, CardFooter
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, UserCircle, ShieldCheck, MessageSquare, CalendarDays, MapPin, Star, User as UserIconLucide } from 'lucide-react'; 
import { format, formatDistanceToNow } from 'date-fns';
import { deletePost } from '@/lib/actions/forums';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import React, { useState } from 'react'; 
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from 'next/link'; 
import type { CodeProps } from 'react-markdown/lib/ast-to-react';
import { ReactionButtons } from './ReactionButtons';


interface PostProps {
    post: PostType;
    currentUser: User | null;
    onEdit: (post: PostType) => void;
    isFirstPost?: boolean;
}

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export function Post({ post, currentUser, onEdit, isFirstPost = false }: PostProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const isAuthor = currentUser?.id === post.authorId;
    const canEditDelete = isAuthor || currentUser?.isAdmin;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deletePost(post.id, post.topicId);
            if (result.success) {
                toast({ title: "Success", description: "Post deleted successfully." });
            } else {
                 throw new Error(result.message || "Failed to delete post.");
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Could not delete post.",
            });
         } finally {
             setIsDeleting(false);
         }
    };

    return (
         <Card id={`post-${post.id}`} className={cn(
             "mb-4 border border-border shadow-sm overflow-hidden", // Add overflow-hidden for rounded corners on children
             isFirstPost && "border-primary/30 bg-primary/5"
         )}>
            <div className="flex flex-col sm:flex-row">
                {/* User Info Pane (Left on sm+, Top on xs) */}
                <div className={cn(
                    "sm:w-[200px] lg:w-[220px] p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-border flex-shrink-0",
                    isFirstPost ? "bg-primary/10" : "bg-card sm:bg-muted/30"
                )}>
                    {post.author && (
                        <>
                            <Link href={`/users/${post.author.username}`} className="block text-center sm:text-left group" title={`View ${post.author.username}'s profile`}>
                                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-border shadow-sm mx-auto sm:mx-0">
                                     <AvatarImage src={post.author.avatarUrl || `https://avatar.vercel.sh/${post.author.username}.png?size=80`} alt={post.author.username} data-ai-hint="user avatar"/>
                                    <AvatarFallback className="text-2xl">{post.author.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <p className="mt-2 text-sm font-semibold text-primary group-hover:underline break-words">
                                    {post.author.username}
                                </p>
                            </Link>
                            <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                                    {post.author.isAdmin ? (
                                        <><ShieldCheck className="h-3.5 w-3.5 text-destructive flex-shrink-0" /> Administrator</>
                                    ) : (
                                        <><UserIconLucide className="h-3.5 w-3.5 flex-shrink-0" /> User</>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 justify-center sm:justify-start"><MessageSquare className="h-3.5 w-3.5 flex-shrink-0" /> Posts: {post.author.postCount ?? 0}</div>
                                {post.author.createdAt && (
                                <div className="flex items-center gap-1.5 justify-center sm:justify-start"><CalendarDays className="h-3.5 w-3.5 flex-shrink-0" /> Joined: {format(new Date(post.author.createdAt), 'MMM yyyy')}</div>
                                )}
                                {post.author.location && (
                                <div className="flex items-center gap-1.5 justify-center sm:justify-start truncate"><MapPin className="h-3.5 w-3.5 flex-shrink-0" /> <span className="truncate" title={post.author.location}>{post.author.location}</span></div>
                                )}
                                <div className="flex items-center gap-1.5 justify-center sm:justify-start"><Star className="h-3.5 w-3.5 flex-shrink-0" /> Points: {post.author.points ?? 0}</div>
                            </div>
                        </>
                    )}
                     {!post.author && (
                        <div className="text-center sm:text-left">
                             <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-border shadow-sm mx-auto sm:mx-0">
                                <AvatarFallback className="text-2xl">?</AvatarFallback>
                            </Avatar>
                            <p className="mt-2 text-sm font-semibold text-muted-foreground">Unknown User</p>
                        </div>
                     )}
                </div>

                {/* Post Content Pane (Right on sm+, Bottom on xs) */}
                <div className="flex-1 p-3 sm:p-4 min-w-0 bg-card">
                    <div className="flex flex-col-reverse sm:flex-row justify-between sm:items-center mb-2 gap-2">
                        <p className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0"/>
                            Posted: {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            {post.updatedAt && new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime() && (
                                <span className="ml-2 flex items-center"><Edit className="h-3.5 w-3.5 mr-1 flex-shrink-0"/> Edited: {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}</span>
                            )}
                        </p>
                        {canEditDelete && (
                            <div className="flex space-x-1 self-end sm:self-center">
                               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(post)} title="Edit Post">
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit Post</span>
                                </Button>
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isDeleting} title="Delete Post">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete Post</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this post.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </div>

                    {post.imageUrl && (
                        <div className="mb-4 relative w-full max-w-xl mx-auto" data-ai-hint="user uploaded image">
                            <Image
                                src={post.imageUrl}
                                alt="User uploaded image"
                                width={600}
                                height={400}
                                className="rounded-md shadow-md object-contain w-full h-auto max-h-[500px]"
                            />
                        </div>
                    )}
                    <article className="prose prose-sm dark:prose-invert max-w-none break-words">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, children, ...props }) => {
                                    if (node.children.length === 1 && node.children[0].type === 'element' && node.children[0].tagName === 'a') {
                                        const linkNode = node.children[0];
                                        const href = linkNode.properties?.href as string | undefined;
                                        if (href) {
                                            const videoId = getYouTubeVideoId(href);
                                            if (videoId) {
                                                return (
                                                    <div className="my-4 aspect-video max-w-xl mx-auto">
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            src={`https://www.youtube.com/embed/${videoId}`}
                                                            title="YouTube video player"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                            allowFullScreen
                                                            className="rounded-md shadow-md"
                                                            sandbox="allow-forms allow-scripts allow-popups allow-same-origin"
                                                        ></iframe>
                                                    </div>
                                                );
                                            }
                                        }
                                    }

                                    const processedChildren = React.Children.map(children, child => {
                                        if (typeof child === 'string') {
                                        const parts = child.split(/(@[a-zA-Z0-9_]+)/g); 
                                        return parts.map((part, index) => {
                                            if (part.startsWith('@') && part.length > 1) {
                                            const username = part.substring(1);
                                            if (/^[a-zA-Z0-9_]+$/.test(username)) { 
                                                return (
                                                <Link
                                                    key={`${index}-${username}`} 
                                                    href={`/users/${encodeURIComponent(username)}`}
                                                    className="text-accent hover:underline font-semibold"
                                                >
                                                    {part}
                                                </Link>
                                                );
                                            }
                                            }
                                            return part; 
                                        });
                                        }
                                        return child; 
                                    });

                                    return <p {...props}>{processedChildren}</p>;
                                },
                                a: ({node, ...props}) => (
                                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                        {props.children}
                                    </a>
                                ),
                                img: ({node, ...props}) => (
                                    <span className="block text-center my-4">
                                        <Image
                                            src={props.src!}
                                            alt={props.alt!}
                                            width={500}
                                            height={300}
                                            className="max-w-full h-auto inline-block rounded-md shadow-sm border"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                            unoptimized={!props.src?.startsWith('data:image')}
                                            data-ai-hint="embedded image"
                                        />
                                        {props.alt && <em className="text-xs text-muted-foreground block mt-1">{props.alt}</em>}
                                    </span>
                                ),
                                code({ node, inline, className, children, ...props }: CodeProps) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={oneDark}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                    ) : (
                                    <code className={cn("bg-muted/50 px-1 py-0.5 rounded text-sm font-mono", className)} {...props}>
                                        {children}
                                    </code>
                                    );
                                },
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-border pl-4 italic my-4 text-muted-foreground" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="pl-2" {...props} />,
                                }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </article>
                    <ReactionButtons 
                        postId={post.id} 
                        initialReactions={post.reactions || []} 
                        currentUser={currentUser} 
                    />
                </div>
            </div>
        </Card>
    );
}

