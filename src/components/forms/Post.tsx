
"use client"; // Need client for state, hooks, event handlers

import type { Post as PostType, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, UserCircle, ShieldCheck, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, strikethrough, etc.)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // Example syntax highlighter
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark'; // Example style
import type { CodeProps } from 'react-markdown/lib/ast-to-react'; // Import CodeProps for correct typing


interface PostProps {
    post: PostType;
    currentUser: User | null;
    onEdit: (post: PostType) => void;
    isFirstPost?: boolean;
}

// Helper function to check if URL is likely an image
const isImageUrl = (url: string) => /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i.test(url);

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export function Post({ post, currentUser, onEdit, isFirstPost = false }: PostProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false); // Add loading state for delete

    const isAuthor = currentUser?.id === post.authorId;
    const canEditDelete = isAuthor || currentUser?.isAdmin;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deletePost(post.id, post.topicId);
            if (result.success) {
                toast({ title: "Success", description: "Post deleted successfully." });
                // Revalidation is handled by the action, parent component might need update if posts are stateful
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
             "mb-4 border border-border shadow-sm",
             isFirstPost && "border-primary/30 bg-primary/5"
         )}>
            <CardHeader className="flex flex-row items-start space-x-4 p-3 sm:p-4 bg-card border-b">
                <Avatar className="h-10 w-10 border flex-shrink-0">
                     <AvatarImage src={`https://avatar.vercel.sh/${post.author?.username || post.authorId}.png?size=40`} alt={post.author?.username} data-ai-hint="user avatar"/>
                    <AvatarFallback>{post.author?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1">
                        <UserCircle className="h-4 w-4 text-muted-foreground"/> {post.author?.username || 'Unknown User'}
                        </CardTitle>
                        {post.author?.isAdmin && (
                             <span className="text-xs font-bold text-destructive flex items-center gap-1">
                                 <ShieldCheck className="h-3.5 w-3.5"/> Admin
                             </span>
                        )}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                       <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3"/> Posted: {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                       </span>
                        {post.updatedAt && post.updatedAt.getTime() !== post.createdAt.getTime() && (
                             <span className="flex items-center gap-1"><Edit className="h-3 w-3"/> Edited: {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}</span>
                        )}
                    </CardDescription>
                </div>
                  {canEditDelete && (
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 ml-auto pl-2">
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
            </CardHeader>
             <CardContent className="p-3 sm:p-4 text-sm">
                 {post.imageUrl && (
                    <div className="mb-4 relative w-full max-w-xl mx-auto" data-ai-hint="user uploaded image">
                        <Image
                            src={post.imageUrl}
                            alt="User uploaded image"
                            width={600} // Adjusted size
                            height={400} // Adjusted size
                            className="rounded-md shadow-md object-contain w-full h-auto max-h-[500px]"
                        />
                    </div>
                )}
                 {/* Markdown Renderer */}
                <article className="prose prose-sm dark:prose-invert max-w-none break-words">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown (tables, strikethrough, etc.)
                        components={{
                             // Basic styling for links
                            a: ({node, ...props}) => (
                                <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                    {props.children}
                                    {/* Optional: Add external link icon */}
                                    {/* <LinkIcon className="h-3 w-3 opacity-70" /> */}
                                </a>
                            ),
                             // Handle images within markdown (e.g., ![alt](url))
                            img: ({node, ...props}) => (
                                <span className="block text-center my-4"> {/* Center images */}
                                    <Image
                                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                        src={props.src!}
                                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                        alt={props.alt!}
                                        width={500} // Default width
                                        height={300} // Default height
                                        className="max-w-full h-auto inline-block rounded-md shadow-sm border"
                                        onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if link broken
                                        unoptimized={!props.src?.startsWith('data:image')} // Optimize only data URIs if needed
                                        data-ai-hint="embedded image"
                                    />
                                     {/* Optional: Display alt text as caption */}
                                     {props.alt && <em className="text-xs text-muted-foreground block mt-1">{props.alt}</em>}
                                </span>
                            ),
                            // Override p tags to check for lone YouTube links
                            p: ({ node, children, ...props }) => {
                                // Check if the paragraph contains only a single child which is a link
                                if (node.children.length === 1 && node.children[0].type === 'element' && node.children[0].tagName === 'a') {
                                    const linkNode = node.children[0];
                                    const href = linkNode.properties?.href as string | undefined;
                                    if (href) {
                                        const videoId = getYouTubeVideoId(href);
                                        if (videoId) {
                                            // Render YouTube embed instead of the paragraph
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
                                // Render as normal paragraph if not a lone YouTube link
                                return <p {...props}>{children}</p>;
                            },
                             // Example: Basic code block highlighting
                             // Uses react-syntax-highlighter
                             // Need to install: npm install react-syntax-highlighter @types/react-syntax-highlighter
                            code({ node, inline, className, children, style, ...props }: CodeProps) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                <SyntaxHighlighter
                                    style={oneDark} // Choose a style
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
                            // Customize other elements as needed (e.g., blockquote, lists)
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-border pl-4 italic my-4 text-muted-foreground" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="pl-2" {...props} />,
                            }}

                    >
                        {post.content}
                    </ReactMarkdown>
                </article>
            </CardContent>
        </Card>
    );
}

