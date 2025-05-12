"use client";

import { useFormState } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createTopic } from "@/lib/actions/forums";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import { PlusCircle } from 'lucide-react';
import type { Category } from '@/lib/types'; // Import Category type if needed for select, or just use categoryId

interface TopicFormProps {
    categoryId: string;
}

const initialState = {
    message: null,
    errors: {},
    success: false,
    topicId: null, // To potentially redirect
};

export function TopicForm({ categoryId }: TopicFormProps) {
    const [state, formAction] = useFormState(createTopic, initialState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null); // Ref to reset form

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
             // Reset the form on success
             formRef.current?.reset();
            // Redirect is handled by the server action
        }
    }, [state, toast]);


    return (
        <Card className="mt-6 mb-8 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5" /> Start a New Topic</CardTitle>
                <CardDescription>Create a new discussion thread in this category.</CardDescription>
            </CardHeader>
            <form action={formAction} ref={formRef}>
                <input type="hidden" name="categoryId" value={categoryId} />
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="title">Topic Title</Label>
                        <Input
                            id="title"
                            name="title"
                            required
                            minLength={5}
                            maxLength={150}
                            placeholder="Enter a descriptive title..."
                            aria-describedby="title-error"
                        />
                        {state?.errors?.title && (
                            <p id="title-error" className="text-sm font-medium text-destructive">
                                {state.errors.title[0]}
                            </p>
                        )}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="firstPostContent">Your First Post</Label>
                        <Textarea
                            id="firstPostContent"
                            name="firstPostContent"
                            required
                            minLength={10}
                            rows={5}
                            placeholder="Start the discussion here..."
                            aria-describedby="firstPostContent-error"
                        />
                         {state?.errors?.firstPostContent && (
                            <p id="firstPostContent-error" className="text-sm font-medium text-destructive">
                                {state.errors.firstPostContent[0]}
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton pendingText="Creating Topic...">Create Topic</SubmitButton>
                </CardFooter>
            </form>
        </Card>
    );
}
