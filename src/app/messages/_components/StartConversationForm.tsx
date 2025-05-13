
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { startConversationWithUsernameAction } from '@/lib/actions/privateMessages';
import type { ActionResponse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/SubmitButton';
import { MessageSquarePlus } from 'lucide-react';

const initialState: ActionResponse = {
  success: false,
  message: '',
  errors: {},
};

export function StartConversationForm() {
  const [state, formAction, isPending] = useActionState(startConversationWithUsernameAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (!state.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
      // Successful redirect is handled by the action itself, so no success toast needed here.
    }
    if (state.success) {
        formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <Card className="mb-6 shadow-md border border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <MessageSquarePlus className="mr-2 h-5 w-5 text-primary" /> Start a New Conversation
        </CardTitle>
        <CardDescription>Enter the username and an optional subject for the conversation.</CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username-pm">Username</Label>
            <Input
              id="username-pm"
              name="username"
              placeholder="Enter username"
              required
              disabled={isPending}
              aria-describedby="username-pm-error"
            />
            {state.errors?.username && (
              <p id="username-pm-error" className="text-sm font-medium text-destructive">
                {typeof state.errors.username === 'string' ? state.errors.username : state.errors.username[0]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject-pm">Subject (Optional)</Label>
            <Input
              id="subject-pm"
              name="subject"
              placeholder="Enter a subject for the conversation"
              maxLength={100}
              disabled={isPending}
              aria-describedby="subject-pm-error"
            />
            {state.errors?.subject && (
              <p id="subject-pm-error" className="text-sm font-medium text-destructive">
                {typeof state.errors.subject === 'string' ? state.errors.subject : state.errors.subject[0]}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton pendingText="Starting..." disabled={isPending}>
            Start Chat
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}

