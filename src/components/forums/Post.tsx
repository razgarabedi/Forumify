import type { Post as PostType, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, UserCircle, ShieldCheck } from 'lucide-react'; // Added ShieldCheck
import { formatDistanceToNow } from 'date-fns';
import { deletePost } from '@/lib/actions/forums'; // Import delete action
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
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface PostProps {
    post: PostType;
    currentUser: User | null;
    onEdit: (post: PostType) => void; // Callback to trigger editing mode
    isFirstPost?: boolean; // Optional flag for the first post in a topic
}

export function Post({ post, currentUser, onEdit, isFirstPost = false }: PostProps) {
    const { toast } = useToast();
    const isAuthor = currentUser?.id === post.authorId;
    const canEditDelete = isAuthor || currentUser?.isAdmin; // Admins can also delete/edit

    const handleDelete = async () => {
        try {
            const result = await deletePost(post.id, post.topicId);
            if (result.success) {
                toast({ title: "Success", description: "Post deleted successfully." });
                // Revalidation is handled by the server action
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
             isFirstPost && "border-primary/30 bg-primary/5" // Highlight first post subtly
         )}>
            <CardHeader className="flex flex-row items-start space-x-4 p-3 sm:p-4 bg-card border-b"> {/* Adjusted padding */}
                <Avatar className="h-10 w-10 border flex-shrink-0">
                     <AvatarImage src={`https://avatar.vercel.sh/${post.author?.username || post.authorId}.png?size=40`} alt={post.author?.username} data-ai-hint="user avatar"/>
                    <AvatarFallback>{post.author?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0"> {/* Ensure wrapping */}
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
                        {post.updatedAt && post.updatedAt.getTime() !== post.createdAt.getTime() && ( // Show edited only if different
                             <span className="flex items-center gap-1"><Edit className="h-3 w-3"/> Edited: {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}</span>
                        )}
                    </CardDescription>
                </div>
                 {/* Edit/Delete Controls - Move to right */}
                  {canEditDelete && (
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 ml-auto pl-2"> {/* Ensure controls are on right */}
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
             <CardContent className="p-3 sm:p-4 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"> {/* Use prose for basic markdown-like styling */}
                 {/* Replace newline characters with <br /> for display */}
                 {post.content.split('\n').map((line, index, arr) => (
                    <React.Fragment key={index}>
                        {line}
                        {index < arr.length - 1 && <br />}
                    </React.Fragment>
                ))}
            </CardContent>
        </Card>
    );
}

// Add React import needed for Fragment
import React from 'react';
