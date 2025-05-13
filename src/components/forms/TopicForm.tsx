
"use client";

import { useActionState, useEffect, useRef, useState } from 'react';
import { Input as ShadInput } from "@/components/ui/input"; // Renamed to avoid conflict
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createTopic } from "@/lib/actions/forums";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import { PlusCircle, UploadCloud, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { RichTextToolbar } from './RichTextToolbar'; // Import the toolbar

interface TopicFormProps {
    categoryId: string;
}

const initialState = {
    message: null,
    errors: {},
    success: false,
    topicId: null,
};

export function TopicForm({ categoryId }: TopicFormProps) {
    const [state, formAction] = useActionState(createTopic, initialState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for the first post textarea

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    // State to manage the first post textarea content directly for the toolbar
    const [firstPostTextContent, setFirstPostTextContent] = useState('');

    useEffect(() => {
        if (state?.message && !state.success) {
             toast({
                variant: "destructive",
                title: "Error",
                description: state.message,
            });
        }
        if (state?.message && state.success && state.topicId) { // Check for topicId for redirect
             toast({
                title: "Success",
                description: state.message,
            });
            // Form reset is not strictly necessary due to redirect, but good practice
            formRef.current?.reset();
            setFirstPostTextContent(''); 
            setImagePreview(null);
            setImageFile(null);
            // Redirect is handled by the server action using the `redirect()` function
        } else if (state?.message && state.success && !state.topicId) {
            // This case might occur if redirect fails or is not part of the success state
            // For now, just show success toast and reset form as before
             toast({
                title: "Success",
                description: state.message,
            });
            formRef.current?.reset();
            setFirstPostTextContent('');
            setImagePreview(null);
            setImageFile(null);
        }
    }, [state, toast]);

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
        if(fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };

    const handleTextChange = (newContent: string) => {
        setFirstPostTextContent(newContent);
    };

    return (
        <Card className="mt-6 mb-8 shadow-md border border-border">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl"><PlusCircle className="mr-2 h-5 w-5" /> Start a New Topic</CardTitle>
                <CardDescription>Create a new discussion thread in this category.</CardDescription>
            </CardHeader>
            <form
                action={(formData) => {
                    // Manually set the firstPostContent from state
                    formData.set('firstPostContent', firstPostTextContent);

                    if (imagePreview && imageFile) {
                        formData.set('firstPostImageUrl', imagePreview);
                    } else {
                        formData.delete('firstPostImageUrl');
                    }
                    formAction(formData);
                }}
                ref={formRef}
            >
                <input type="hidden" name="categoryId" value={categoryId} />
                <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                        <Label htmlFor="title">Topic Title</Label>
                        <ShadInput
                            id="title"
                            name="title"
                            required
                            minLength={5}
                            maxLength={150}
                            placeholder="Enter a descriptive title..."
                            aria-invalid={!!state?.errors?.title}
                            aria-describedby="title-error"
                        />
                        {state?.errors?.title && (
                            <p id="title-error" className="text-sm font-medium text-destructive pt-1">
                                {state.errors.title[0]}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1"> {/* Reduced bottom margin */}
                        <Label htmlFor="firstPostContent">Your First Post</Label>
                         {/* Rich Text Toolbar */}
                         <RichTextToolbar
                            textareaRef={textareaRef}
                            onContentChange={handleTextChange}
                            currentContent={firstPostTextContent}
                         />
                        <Textarea
                            id="firstPostContent"
                            name="firstPostContent" // Keep name for non-JS fallback
                            ref={textareaRef}
                            required
                            minLength={10}
                            rows={7} // Slightly larger for editor
                            placeholder="Start the discussion here... Use markdown for formatting."
                            value={firstPostTextContent} // Controlled component
                            onChange={(e) => handleTextChange(e.target.value)} // Update state on direct typing
                            aria-invalid={!!state?.errors?.firstPostContent}
                            aria-describedby="firstPostContent-error"
                             className="rounded-t-none focus:z-10 focus:ring-offset-0 focus:ring-1" // Adjust styling for toolbar
                        />
                        {state?.errors?.firstPostContent && (
                            <p id="firstPostContent-error" className="text-sm font-medium text-destructive pt-1">
                                {state.errors.firstPostContent[0]}
                            </p>
                        )}
                    </div>

                    {/* Image Upload Section for First Post */}
                    <div className="space-y-2">
                        <Label htmlFor="topic-image-upload">Attach Image to First Post (Optional, max 2MB)</Label>
                         <ShadInput
                            id="topic-image-upload"
                            name="imageFileTopic" // Unique name for this input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={(e) => handleFileChange(e.target.files)}
                            className="hidden" // Hidden, triggered by label
                            ref={fileInputRef}
                        />
                        <label
                            htmlFor="topic-image-upload"
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
                        {state?.errors?.firstPostImageUrl && (
                            <p className="text-sm font-medium text-destructive pt-1">
                                 {typeof state.errors.firstPostImageUrl === 'string' ? state.errors.firstPostImageUrl : state.errors.firstPostImageUrl?.[0]}
                            </p>
                        )}
                    </div>

                    {imagePreview && (
                        <div className="mt-4 space-y-2">
                            <Label>Image Preview:</Label>
                             <div className="relative group w-full max-w-md border rounded-md overflow-hidden shadow-sm">
                                <Image src={imagePreview} alt="Preview" width={400} height={300} className="object-contain w-full h-auto max-h-60" data-ai-hint="upload preview"/>
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
                     {/* Hidden input is handled by the formAction wrapper now */}
                    {/* <input type="hidden" name="firstPostImageUrl" value={imagePreview || ''} /> */}
                </CardContent>
                <CardFooter>
                    <SubmitButton pendingText="Creating Topic...">Create Topic</SubmitButton>
                </CardFooter>
            </form>
        </Card>
    );
}

