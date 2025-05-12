import type { Post as PostType, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, UserCircle } from 'lucide-react';
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

interface PostProps {
    post: PostType;
    currentUser: User | null;
    onEdit: (post: PostType) => void; // Callback to trigger editing mode
}

export function Post({ post, currentUser, onEdit }: PostProps) {
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
        <Card id={`post-${post.id}`} className="mb-4 border border-border shadow-sm">
            <CardHeader className="flex flex-row items-start space-x-4 p-4 bg-secondary/50 border-b">
                <Avatar className="h-10 w-10 border">
                     <AvatarImage src={`https://avatar.vercel.sh/${post.author?.username || post.authorId}.png`} alt={post.author?.username} data-ai-hint="user avatar"/>
                    <AvatarFallback>{post.author?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-sm font-semibold flex items-center">
                       <UserCircle className="h-4 w-4 mr-1 text-muted-foreground"/> {post.author?.username || 'Unknown User'}
                       {post.author?.isAdmin && <span className="ml-2 text-xs font-bold text-destructive">(Admin)</span>}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground flex items-center mt-1">
                       <Clock className="h-3 w-3 mr-1"/> Posted: {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        {post.updatedAt && (
                             <span className="ml-2 flex items-center"><Edit className="h-3 w-3 mr-1"/> Edited: {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}</span>
                        )}
                    </CardDescription>
                </div>
                 {/* Edit/Delete Controls */}
                  {canEditDelete && (
                    <div className="flex space-x-1">
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
            <CardContent className="p-4 whitespace-pre-wrap text-sm leading-relaxed">
                {post.content}
            </CardContent>
            {/* CardFooter can be used for reactions, quotes, etc. later */}
            {/* <CardFooter className="p-4 pt-2 text-xs text-muted-foreground">
                Footer content if needed
            </CardFooter> */}
        </Card>
    );
}
