"use client";

import { useState } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { TopicForm } from '@/components/forms/TopicForm';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Info, LogIn, UserPlus, PlusCircle, X } from 'lucide-react';

interface CreateTopicControlProps {
    categoryId: string;
    user: User | null;
}

export function CreateTopicControl({ categoryId, user }: CreateTopicControlProps) {
    const [showForm, setShowForm] = useState(false);

    if (!user) {
        return (
            <Alert className="border-primary/30 bg-primary/5 my-6">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Login Required</AlertTitle>
                <AlertDescription>
                    You need to login or register to start a new topic.
                    <div className="flex gap-2 mt-2">
                        <Button size="sm" asChild>
                            <Link href={`/login?redirect=/categories/${categoryId}`}>
                                <LogIn className="mr-1 h-4 w-4" /> Login
                            </Link>
                        </Button>
                        <Button size="sm" variant="secondary" asChild>
                            <Link href={`/register?redirect=/categories/${categoryId}`}>
                                <UserPlus className="mr-1 h-4 w-4" /> Register
                            </Link>
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    if (showForm) {
        return (
            <div className="my-6">
                <TopicForm categoryId={categoryId} />
                <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="mt-4"
                >
                    <X className="mr-2 h-4 w-4" /> Cancel New Topic
                </Button>
            </div>
        );
    }

    return (
        <div className="my-6 text-center sm:text-left">
            <Button onClick={() => setShowForm(true)} size="lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Start a New Topic
            </Button>
        </div>
    );
}
