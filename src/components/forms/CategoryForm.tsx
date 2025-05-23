"use client";

import { useActionState, useEffect } from 'react'; // Import useActionState from react
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createCategory } from "@/lib/actions/forums";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import { PlusCircle } from 'lucide-react';

const initialState = {
    message: null,
    errors: {},
    success: false,
};

export function CategoryForm() {
    const [state, formAction] = useActionState(createCategory, initialState);
    const { toast } = useToast();

     useEffect(() => {
        if (state?.message && !state.errors && state.success === false) {
             toast({
                variant: "destructive",
                title: "Error",
                description: state.message,
            });
        }
         if (state?.message && state.success === true) {
             toast({
                title: "Success",
                description: state.message,
            });
            // Optionally reset form or redirect here
        }
    }, [state, toast]);


    return (
        <Card className="mt-6 mb-8 shadow-md border border-border"> {/* Added border */}
             <CardHeader className="pb-4"> {/* Adjusted padding */}
                <CardTitle className="flex items-center text-xl"><PlusCircle className="mr-2 h-5 w-5" /> Create New Category</CardTitle>
                <CardDescription>Add a new category for discussions (Admin only).</CardDescription>
            </CardHeader>
            <form action={formAction}>
                 <CardContent className="space-y-4 pt-0"> {/* Adjusted padding */}
                     <div className="space-y-2">
                        <Label htmlFor="name">Category Name</Label>
                        <Input
                            id="name"
                            name="name"
                            required
                            minLength={3}
                            maxLength={100}
                            aria-invalid={!!state?.errors?.name}
                            aria-describedby="name-error"
                        />
                        {state?.errors?.name && (
                            <p id="name-error" className="text-sm font-medium text-destructive pt-1">
                                {state.errors.name[0]}
                            </p>
                        )}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            maxLength={255}
                            placeholder="A brief description of the category..."
                             aria-invalid={!!state?.errors?.description}
                            aria-describedby="description-error"
                        />
                         {state?.errors?.description && (
                            <p id="description-error" className="text-sm font-medium text-destructive pt-1">
                                {state.errors.description[0]}
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    {/* Use primary button style */}
                    <SubmitButton pendingText="Creating...">Create Category</SubmitButton>
                </CardFooter>
            </form>
        </Card>
    );
}
