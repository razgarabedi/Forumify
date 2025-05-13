
"use client";

import { useActionState, useEffect, useRef, useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { submitPost } from "@/lib/actions/forums";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import type { Post } from '@/lib/types';
import { MessageSquarePlus, Edit, UploadCloud, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '../ui/input';
import { RichTextToolbar } from './RichTextToolbar'; // Import the toolbar

interface PostFormProps {
    topicId: string;
    editingPost?: Post | null;
    onEditCancel?: () => void;
}

const initialState = {
    message: null,
    errors: {},
    success: false,
    post: null,
};

export function PostForm({ topicId, editingPost, onEditCancel }: PostFormProps) {
    const [state, formAction] = useActionState(submitPost, initialState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imagePreview, setImagePreview] = useState<string | null>(editingPost?.imageUrl || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
    // State to manage the textarea content directly for the toolbar
    const [textContent, setTextContent] = useState(editingPost?.content || '');

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
            formRef.current?.reset();
            setTextContent(''); // Clear textarea state
            setImagePreview(null);
            setImageFile(null);
            setRemoveCurrentImage(false);
            if (isEditing && onEditCancel) {
                onEditCancel();
            }
        }
    }, [state, toast, isEditing, onEditCancel]);

    useEffect(() => {
        // Update textContent when editingPost changes (start editing or cancel)
        setTextContent(editingPost?.content || '');
        setImagePreview(editingPost?.imageUrl || null);
        setRemoveCurrentImage(false); // Reset removal flag

        if (isEditing) {
             // Focus after a short delay to ensure textarea is ready
            setTimeout(() => textareaRef.current?.focus(), 50);
        } else {
            setImagePreview(null); // Clear preview for new posts
        }
    }, [editingPost, isEditing]);

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ variant: "destructive", title: "File too large", description: "Please upload an image smaller than 2MB." });
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast({ variant: "destructive", title: "Invalid file type", description: "Please upload an image file (jpeg, png, gif, webp)." });
                return;
            }
            setImageFile(file);
            setRemoveCurrentImage(false); // If a new file is selected, don't remove existing one yet
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true); // Keep it true while dragging over
    };
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageFile(null);
        if (editingPost?.imageUrl) {
            setRemoveCurrentImage(true);
        }
        if(fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };

     const handleTextChange = (newContent: string) => {
        setTextContent(newContent);
    };

     const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Prevent form submission on Enter key press unless Shift is held
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Optionally, you could insert a newline character here manually if needed,
            // but default textarea behavior usually handles this.
            // However, if the preventDefault stops newline insertion:
            // const { selectionStart, selectionEnd, value } = e.currentTarget;
            // const newValue = value.substring(0, selectionStart) + "\n" + value.substring(selectionEnd);
            // handleTextChange(newValue);
            // // Move cursor after inserted newline
            // requestAnimationFrame(() => {
            //     if (textareaRef.current) {
            //         textareaRef.current.selectionStart = selectionStart + 1;
            //         textareaRef.current.selectionEnd = selectionStart + 1;
            //     }
            // });
        }
    };


    return (
        <Card className={`mt-6 mb-8 shadow-md border ${isEditing ? 'border-accent ring-1 ring-accent' : 'border-border'}`}>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                    {isEditing ? <><Edit className="mr-2 h-5 w-5 text-accent"/> Edit Post</> : <><MessageSquarePlus className="mr-2 h-5 w-5 text-primary"/> Add a Reply</>}
                </CardTitle>
            </CardHeader>
            <form
                action={(formData) => {
                    // Manually set the content from state
                    formData.set('content', textContent);

                    if (imagePreview && imageFile) { // New image uploaded
                        formData.set('imageUrl', imagePreview);
                    } else if (removeCurrentImage) { // Existing image marked for removal
                        formData.set('imageUrl', ''); // Or use a specific flag like 'removeImage'='true'
                        formData.set('removeImage', 'true');
                    } else if (editingPost?.imageUrl && !imageFile && !removeCurrentImage) { // Editing, existing image kept
                        formData.set('imageUrl', editingPost.imageUrl);
                    } else {
                        formData.delete('imageUrl'); // No image or image removed
                    }
                    formAction(formData);
                }}
                ref={formRef}
            >
                <input type="hidden" name="topicId" value={topicId} />
                {isEditing && <input type="hidden" name="postId" value={editingPost.id} />}

                <CardContent className="space-y-4 pt-0">
                    <div className="space-y-1">
                        <Label htmlFor="content" className="sr-only">{isEditing ? 'Edit Content' : 'Reply Content'}</Label>
                        {/* Rich Text Toolbar */}
                         <RichTextToolbar
                            textareaRef={textareaRef}
                            onContentChange={handleTextChange}
                            currentContent={textContent}
                         />
                        <Textarea
                            id="content"
                            name="content" // Keep name for potential non-JS fallback, though value is controlled
                            ref={textareaRef}
                            required
                            minLength={10}
                            rows={isEditing ? 8 : 6} // Slightly larger for editor
                            placeholder={isEditing ? "Update your post..." : "Write your reply here... Use markdown for formatting."}
                            value={textContent} // Controlled component
                            onChange={(e) => handleTextChange(e.target.value)} // Update state on direct typing
                            onKeyDown={handleKeyDown} // Add keydown handler
                            aria-invalid={!!state?.errors?.content}
                            aria-describedby="content-error"
                            className="rounded-t-none focus:z-10 focus:ring-offset-0 focus:ring-1" // Adjust styling for toolbar
                        />
                        {state?.errors?.content && (
                            <p id="content-error" className="text-sm font-medium text-destructive pt-1">
                                {state.errors.content[0]}
                            </p>
                        )}
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-2">
                        <Label htmlFor="post-image-upload">Attach Image (Optional, max 2MB)</Label>
                        <Input
                            id="post-image-upload"
                            name="imageFile" // This name is for the input itself, not directly submitted with formAction. Data URI is via imageUrl.
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={(e) => handleFileChange(e.target.files)}
                            className="hidden" // Hidden, triggered by label
                            ref={fileInputRef}
                        />
                        <label
                            htmlFor="post-image-upload"
                            className={`mt-1 flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer
                                ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/50'}`}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className="space-y-1 text-center">
                                <UploadCloud className={`mx-auto h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div className="flex text-sm text-muted-foreground">
                                    <span className={`${isDragging ? 'text-primary': 'text-accent hover:text-accent/80 font-medium'}`}>Upload a file</span>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP up to 2MB</p>
                            </div>
                        </label>
                         {state?.errors?.imageUrl && (
                            <p className="text-sm font-medium text-destructive pt-1">
                                {typeof state.errors.imageUrl === 'string' ? state.errors.imageUrl : state.errors.imageUrl?.[0]}
                            </p>
                        )}
                    </div>

                    {imagePreview && (
                        <div className="mt-4 space-y-2">
                            <Label>Image Preview:</Label>
                            <div className="relative group w-full max-w-md border rounded-md overflow-hidden shadow-sm">
                                <Image src={imagePreview} alt="Preview" width={400} height={300} className="object-contain w-full h-auto max-h-60" data-ai-hint="image preview" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 opacity-70 group-hover:opacity-100 transition-opacity"
                                    onClick={handleRemoveImage}
                                    aria-label="Remove image"
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                     {/* Hidden input for actual image data URI to be submitted */}
                    {/* This is now handled in the formAction wrapper above */}
                    {/* <input type="hidden" name="imageUrl" value={imagePreview || ''} /> */}
                     {/* Hidden input to signal image removal */}
                    {/* <input type="hidden" name="removeImage" value={removeCurrentImage ? 'true' : 'false'} /> */}

                </CardContent>
                <CardFooter className="flex justify-between">
                    <SubmitButton
                        pendingText={isEditing ? "Saving..." : "Posting..."}
                        className={isEditing ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}
                    >
                        {isEditing ? 'Save Changes' : 'Post Reply'}
                    </SubmitButton>
                    {isEditing && onEditCancel && (
                        <Button type="button" variant="outline" onClick={() => {
                            onEditCancel();
                            setImagePreview(editingPost?.imageUrl || null);
                            setImageFile(null);
                            setRemoveCurrentImage(false);
                        }}>
                            Cancel Edit
                        </Button>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}

