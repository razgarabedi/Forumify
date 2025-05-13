
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
      // If form reset is desired on success *before* redirect, that would be more complex.
    }
    if (state.success) {
        // This part might not be reached if redirect happens immediately in action.
        // If it is reached (e.g. redirect is conditional and didn't happen), then reset.
        formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <Card className="mb-6 shadow-md border border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <MessageSquarePlus className="mr-2 h-5 w-5 text-primary" /> Start a New Conversation
        </CardTitle>
        <CardDescription>Enter the username of the person you want to message.</CardDescription>
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
