
"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from 'react';
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
import { RichTextToolbar, parseHtmlToSimpleStructure, simpleStructureToMarkdown, cleanupMarkdown } from './RichTextToolbar'; 

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
            setTextContent(''); 
            setImagePreview(null);
            setImageFile(null);
            setRemoveCurrentImage(false);
            if (isEditing && onEditCancel) {
                onEditCancel();
            }
        }
    }, [state, toast, isEditing, onEditCancel]);

    useEffect(() => {
        setTextContent(editingPost?.content || '');
        setImagePreview(editingPost?.imageUrl || null);
        setRemoveCurrentImage(false); 

        if (isEditing) {
            setTimeout(() => textareaRef.current?.focus(), 50);
        } else {
            setImagePreview(null); 
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
            setRemoveCurrentImage(false); 
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
        setIsDragging(true); 
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
            fileInputRef.current.value = ""; 
        }
    };

     const handleTextChange = (newContent: string) => {
        setTextContent(newContent);
    };

    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        event.preventDefault();
        const clipboardData = event.clipboardData;
        const html = clipboardData.getData('text/html');
        const plainText = clipboardData.getData('text/plain');
        let pastedMarkdown = '';

        if (html) {
            try {
                const simpleStructure = parseHtmlToSimpleStructure(html);
                pastedMarkdown = simpleStructureToMarkdown(simpleStructure);
                pastedMarkdown = cleanupMarkdown(pastedMarkdown);
            } catch (e) {
                console.error("Error parsing pasted HTML, falling back to plain text:", e);
                pastedMarkdown = plainText;
            }
        } else {
            pastedMarkdown = plainText;
        }
        
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newPastedContent = textContent.substring(0, start) + pastedMarkdown + textContent.substring(end);
            handleTextChange(newPastedContent);

            requestAnimationFrame(() => {
                if (textarea) {
                    textarea.focus();
                    textarea.setSelectionRange(start + pastedMarkdown.length, start + pastedMarkdown.length);
                }
            });
        }
    }, [textareaRef, textContent, handleTextChange]);


    return (
        <Card className={`mt-6 mb-8 shadow-md border ${isEditing ? 'border-accent ring-1 ring-accent' : 'border-border'}`}>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                    {isEditing ? <><Edit className="mr-2 h-5 w-5 text-accent"/> Edit Post</> : <><MessageSquarePlus className="mr-2 h-5 w-5 text-primary"/> Add a Reply</>}
                </CardTitle>
            </CardHeader>
            <form
                action={(formData) => {
                    formData.set('content', textContent);

                    if (imagePreview && imageFile) { 
                        formData.set('imageUrl', imagePreview);
                    } else if (removeCurrentImage) { 
                        formData.set('imageUrl', ''); 
                        formData.set('removeImage', 'true');
                    } else if (editingPost?.imageUrl && !imageFile && !removeCurrentImage) { 
                        formData.set('imageUrl', editingPost.imageUrl);
                    } else {
                        // Ensure imageUrl is not sent if no image or if it's cleared and there was no original
                        formData.delete('imageUrl'); 
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
                         <RichTextToolbar
                            textareaRef={textareaRef}
                            onContentChange={handleTextChange}
                            currentContent={textContent}
                         />
                        <Textarea
                            id="content"
                            name="content" 
                            ref={textareaRef}
                            required
                            minLength={10}
                            rows={isEditing ? 8 : 6} 
                            placeholder={isEditing ? "Update your post..." : "Write your reply here... Use markdown for formatting."}
                            value={textContent} 
                            onChange={(e) => handleTextChange(e.target.value)} 
                            onPaste={handlePaste} 
                            aria-invalid={!!state?.errors?.content}
                            aria-describedby="content-error"
                            className="rounded-t-none focus:z-10 focus:ring-offset-0 focus:ring-1" 
                        />
                        {state?.errors?.content && (
                            <p id="content-error" className="text-sm font-medium text-destructive pt-1">
                                {state.errors.content[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="post-image-upload">Attach Image (Optional, max 2MB)</Label>
                        <Input
                            id="post-image-upload"
                            name="imageFile" 
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={(e) => handleFileChange(e.target.files)}
                            className="hidden" 
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
