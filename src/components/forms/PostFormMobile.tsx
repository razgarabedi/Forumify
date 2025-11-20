"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { submitPost } from "@/lib/actions/forums";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import type { Post } from '@/lib/types';
import { MessageSquarePlus, Edit, UploadCloud, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '../ui/input';
import { RichTextToolbar, parseHtmlToSimpleStructure, simpleStructureToMarkdown, cleanupMarkdown } from './RichTextToolbar';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface PostFormMobileProps {
    topicId: string;
    editingPost?: Post | null;
    onEditCancel?: () => void;
    onPostAdded?: (post: Post) => void;
    onPostUpdated?: (post: Post) => void;
}

const initialState = {
    message: null,
    errors: {},
    success: false,
    post: null,
};

export function PostFormMobile({ topicId, editingPost, onEditCancel, onPostAdded, onPostUpdated }: PostFormMobileProps) {
    const [state, formAction] = useActionState(submitPost, initialState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stickyBarRef = useRef<HTMLDivElement>(null);

    const [imagePreview, setImagePreview] = useState<string | null>(editingPost?.imageUrl || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
    const [textContent, setTextContent] = useState(editingPost?.content || '');
    const [showPreview, setShowPreview] = useState(false);
    const [isSticky, setIsSticky] = useState(false);

    const isEditing = !!editingPost;

    // Sticky button bar on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (textareaRef.current) {
                const rect = textareaRef.current.getBoundingClientRect();
                setIsSticky(rect.top < 100);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            setShowPreview(false);
            if (isEditing) {
                // Post was updated
                if ((state as any).post && onPostUpdated) {
                    onPostUpdated((state as any).post as Post);
                } else if (onPostUpdated && editingPost) {
                    // Fallback: if post not in response, trigger refresh
                    onPostUpdated(editingPost);
                }
                if (onEditCancel) {
                    onEditCancel();
                }
            } else {
                // New post was added
                if ((state as any).post && onPostAdded) {
                    const newPost = (state as any).post as Post;
                    onPostAdded(newPost);
                    // Scroll to the new post after a brief delay
                    setTimeout(() => {
                        const postElement = document.getElementById(`post-${newPost.id}`);
                        postElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                } else if (onPostAdded) {
                    // Fallback: if post not in response, trigger refresh
                    onPostAdded(undefined);
                }
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
            if (file.size > 2 * 1024 * 1024) {
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
        <>
            <Card className={`mt-6 mb-8 shadow-md border ${isEditing ? 'border-accent ring-1 ring-accent' : 'border-border'} md:hidden`}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                        {isEditing ? <><Edit className="mr-2 h-4 w-4 text-accent"/> Edit Post</> : <><MessageSquarePlus className="mr-2 h-4 w-4 text-primary"/> Add a Reply</>}
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
                            formData.delete('imageUrl'); 
                        }
                        formAction(formData);
                    }}
                    ref={formRef}
                >
                    <input type="hidden" name="topicId" value={topicId} />
                    {isEditing && <input type="hidden" name="postId" value={editingPost.id} />}

                    <CardContent className="space-y-3 pt-0">
                        <div className="space-y-1">
                            <Label htmlFor="content-mobile" className="sr-only">{isEditing ? 'Edit Content' : 'Reply Content'}</Label>
                             <RichTextToolbar
                                textareaRef={textareaRef}
                                onContentChange={handleTextChange}
                                currentContent={textContent}
                             />
                            {!showPreview ? (
                                <Textarea
                                    id="content-mobile"
                                    name="content" 
                                    ref={textareaRef}
                                    required
                                    minLength={10}
                                    rows={6} 
                                    placeholder={isEditing ? "Update your post..." : "Write your reply here... Use markdown for formatting."}
                                    value={textContent} 
                                    onChange={(e) => handleTextChange(e.target.value)} 
                                    onPaste={handlePaste} 
                                    aria-invalid={!!state?.errors?.content}
                                    aria-describedby="content-error"
                                    className="rounded-t-none focus:z-10 focus:ring-offset-0 focus:ring-1" 
                                />
                            ) : (
                                <div className="min-h-[120px] p-3 border rounded-md bg-muted/30 prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                    >
                                        {textContent || '*No content to preview*'}
                                    </ReactMarkdown>
                                </div>
                            )}
                            {state?.errors?.content && (
                                <p id="content-error" className="text-sm font-medium text-destructive pt-1">
                                    {state.errors.content[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="post-image-upload-mobile" className="text-xs">Attach Image (Optional, max 2MB)</Label>
                            <Input
                                id="post-image-upload-mobile"
                                name="imageFile" 
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={(e) => handleFileChange(e.target.files)}
                                className="hidden" 
                                ref={fileInputRef}
                            />
                            <label
                                htmlFor="post-image-upload-mobile"
                                className={cn(
                                    "flex justify-center w-full h-24 px-4 pt-3 pb-4 border-2 border-dashed rounded-md cursor-pointer text-xs",
                                    isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/50'
                                )}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <div className="space-y-1 text-center">
                                    <UploadCloud className={`mx-auto h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <div className="flex text-xs text-muted-foreground">
                                        <span className={cn(isDragging ? 'text-primary': 'text-accent hover:text-accent/80 font-medium')}>Upload</span>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                </div>
                            </label>
                             {state?.errors?.imageUrl && (
                                <p className="text-sm font-medium text-destructive pt-1">
                                    {typeof state.errors.imageUrl === 'string' ? state.errors.imageUrl : state.errors.imageUrl?.[0]}
                                </p>
                            )}
                        </div>

                        {imagePreview && (
                            <div className="mt-2 space-y-2">
                                <Label className="text-xs">Image Preview:</Label>
                                <div className="relative group w-full border rounded-md overflow-hidden shadow-sm">
                                    <Image src={imagePreview} alt="Preview" width={400} height={300} className="object-contain w-full h-auto max-h-40" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity"
                                        onClick={handleRemoveImage}
                                        aria-label="Remove image"
                                    >
                                        <XCircle className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    
                    {/* Sticky Action Buttons */}
                    <div 
                        ref={stickyBarRef}
                        className={cn(
                            "sticky bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3 md:hidden transition-all",
                            isSticky ? "shadow-lg" : ""
                        )}
                    >
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                {showPreview ? 'Edit' : 'Preview'}
                            </Button>
                            <SubmitButton
                                pendingText={isEditing ? "Saving..." : "Posting..."}
                                className={cn(
                                    "flex-1",
                                    isEditing ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''
                                )}
                            >
                                {isEditing ? 'Save' : 'Post'}
                            </SubmitButton>
                            {isEditing && onEditCancel && (
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        onEditCancel();
                                        setImagePreview(editingPost?.imageUrl || null);
                                        setImageFile(null);
                                        setRemoveCurrentImage(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Card>
        </>
    );
}

