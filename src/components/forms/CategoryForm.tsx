"use client";

import { useActionState, useEffect, useState, useMemo } from 'react'; // Import useActionState from react
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createCategory } from "@/lib/actions/forums";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import { PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label as UiLabel } from '@/components/ui/label';
import type { Category } from '@/lib/types';

const initialState = {
    message: null,
    errors: {},
    success: false,
};

interface CategoryFormProps {
    categories?: Category[];
}

export function CategoryForm({ categories = [] }: CategoryFormProps) {
    const [state, formAction] = useActionState(createCategory, initialState);
    const { toast } = useToast();
    const [selectedType, setSelectedType] = useState<'category' | 'forum'>('category');
    const parentOptions = useMemo(() => categories.filter(c => c.type === 'category'), [categories]);

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
                <CardTitle className="flex items-center text-xl"><PlusCircle className="mr-2 h-5 w-5" /> Create New Forum/Category</CardTitle>
                <CardDescription>Create a header Category or a Forum under a Category.</CardDescription>
            </CardHeader>
            <form action={formAction}>
                 <CardContent className="space-y-4 pt-0"> {/* Adjusted padding */}
                    {/* Step 1: Forum Type */}
                    <div className="space-y-2">
                        <UiLabel htmlFor="type">Forum Type</UiLabel>
                        <Select name="type" defaultValue={selectedType} onValueChange={(v) => setSelectedType(v as 'category' | 'forum')}>
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="category">Category (header)</SelectItem>
                                <SelectItem value="forum">Forum (posting area)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
                    {selectedType === 'forum' ? (
                        <div className="space-y-2">
                            <UiLabel htmlFor="parentId">Parent Category</UiLabel>
                            <Select name="parentId" defaultValue={parentOptions[0]?.id || 'none'}>
                                <SelectTrigger id="parentId">
                                    <SelectValue placeholder="Select a Category header" />
                                </SelectTrigger>
                                <SelectContent>
                                    {parentOptions.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <input type="hidden" name="parentId" value="none" />
                    )}
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
