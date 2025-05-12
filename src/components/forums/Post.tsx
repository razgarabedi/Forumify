
import type { Post as PostType, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, UserCircle, ShieldCheck } from 'lucide-react';
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
import React from 'react'; // Import React for Fragment

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

// Component to render post content with YouTube embeds
const PostContentRenderer = ({ content }: { content: string }) => {
    const parts = content.split(/(\n)/).flatMap(part => part.split(/(https?:\/\/[^\s]+)/g)); // Split by newlines and URLs

    return (
        <>
            {parts.map((part, index) => {
                if (part === '\n') {
                    return <br key={`br-${index}`} />;
                }
                const videoId = getYouTubeVideoId(part);
                if (videoId) {
                    return (
                        <div key={`youtube-${index}`} className="my-4 aspect-video max-w-xl mx-auto">
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
                // Check for other image URLs (simple check, not robust)
                if (/\.(jpeg|jpg|gif|png|webp)$/i.test(part)) {
                   return (
                    <div key={`image-link-${index}`} className="my-4 max-w-xl mx-auto">
                        <Image
                            src={part}
                            alt="Embedded image from URL"
                            width={500}
                            height={300}
                            className="rounded-md shadow-md object-contain max-h-[400px] w-auto"
                            unoptimized // Use for external, non-data URLs if not in remotePatterns
                            onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
                            data-ai-hint="linked image"
                        />
                    </div>
                   );
                }
                return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
            })}
        </>
    );
};


export function Post({ post, currentUser, onEdit, isFirstPost = false }: PostProps) {
    const { toast } = useToast();
    const isAuthor = currentUser?.id === post.authorId;
    const canEditDelete = isAuthor || currentUser?.isAdmin;

    const handleDelete = async () => {
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
                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(post)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Post</span>
                        </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive">
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
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                     onClick={handleDelete}
                                     className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                    Delete
                                 </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardHeader>
             <CardContent className="p-3 sm:p-4 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                 {post.imageUrl && (
                    <div className="mb-4 relative w-full max-w-md mx-auto" data-ai-hint="user uploaded image">
                        <Image
                            src={post.imageUrl}
                            alt="User uploaded image"
                            width={500}
                            height={300}
                            className="rounded-md shadow-md object-contain w-full h-auto max-h-[400px]"
                        />
                    </div>
                )}
                <PostContentRenderer content={post.content} />
            </CardContent>
        </Card>
    );
}
