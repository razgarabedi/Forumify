"use client";

import { useFormState } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { submitPost } from "@/lib/actions/forums";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import type { Post } from '@/lib/types';
import { MessageSquarePlus, Edit } from 'lucide-react';

interface PostFormProps {
    topicId: string;
    editingPost?: Post | null; // Pass post data if editing
    onEditCancel?: () => void; // Function to cancel editing mode
}

const initialState = {
    message: null,
    errors: {},
    success: false,
    post: null,
};

export function PostForm({ topicId, editingPost, onEditCancel }: PostFormProps) {
    const [state, formAction] = useFormState(submitPost, initialState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for focusing

    const isEditing = !!editingPost;

     useEffect(() => {
        if (state?.message && !state.success) {
             toast({
                variant: "destructive",
                title: "Error",
                description: state.message,
            });
        }
         if (state?.message && state.success) {
             toast({
                title: "Success",
                description: state.message,
            });
             formRef.current?.reset(); // Reset form on successful submission
             if (isEditing && onEditCancel) {
                onEditCancel(); // Exit editing mode
             }
        }
    }, [state, toast, isEditing, onEditCancel]);

     // Focus textarea when entering edit mode
     useEffect(() => {
        if (isEditing) {
            textareaRef.current?.focus();
            textareaRef.current?.select();
        }
    }, [isEditing]);


    return (
        <Card className={`mt-6 mb-8 shadow-md ${isEditing ? 'border-accent ring-1 ring-accent' : ''}`}>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                    {isEditing ? <><Edit className="mr-2 h-5 w-5"/> Edit Post</> : <><MessageSquarePlus className="mr-2 h-5 w-5"/> Add a Reply</>}
                </CardTitle>
            </CardHeader>
            <form action={formAction} ref={formRef}>
                <input type="hidden" name="topicId" value={topicId} />
                 {isEditing && <input type="hidden" name="postId" value={editingPost.id} />}
                <CardContent>
                     <div className="space-y-2">
                        <Label htmlFor="content" className="sr-only">{isEditing ? 'Edit Content' : 'Reply Content'}</Label>
                        <Textarea
                            id="content"
                            name="content"
                            ref={textareaRef}
                            required
                            minLength={10}
                            rows={isEditing ? 6 : 4}
                            placeholder={isEditing ? "Update your post..." : "Write your reply here..."}
                            defaultValue={isEditing ? editingPost.content : ""}
                            aria-describedby="content-error"
                        />
                         {state?.errors?.content && (
                            <p id="content-error" className="text-sm font-medium text-destructive">
                                {state.errors.content[0]}
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <SubmitButton
                        pendingText={isEditing ? "Saving..." : "Posting..."}
                        className={isEditing ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}
                    >
                        {isEditing ? 'Save Changes' : 'Post Reply'}
                    </SubmitButton>
                     {isEditing && onEditCancel && (
                         <Button type="button" variant="outline" onClick={onEditCancel}>
                            Cancel Edit
                         </Button>
                     )}
                </CardFooter>
            </form>
        </Card>
    );
}
