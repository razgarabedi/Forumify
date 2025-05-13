
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { sendPrivateMessageAction } from '@/lib/actions/privateMessages';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SendHorizonal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SubmitButton } from '@/components/SubmitButton'; // Re-using SubmitButton

interface MessageFormProps {
  conversationId: string;
  receiverId: string; // ID of the other participant in the conversation
}

const initialState = {
  message: null,
  errors: {},
  success: false,
};

export function MessageForm({ conversationId, receiverId }: MessageFormProps) {
  const [state, formAction, isPending] = useActionState(sendPrivateMessageAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.message && !state.success) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
    if (state?.success) {
      // Message successfully sent, clear the form
      formRef.current?.reset();
      textareaRef.current?.focus(); // Keep focus on textarea for next message
      // No success toast needed as message appears in list.
    }
  }, [state, toast]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline
      if (!isPending && formRef.current && textareaRef.current && textareaRef.current.value.trim() !== '') {
        // Manually submit the form if Enter is pressed without Shift
        formRef.current.requestSubmit();
      }
    }
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className="p-2 sm:p-3 border-t bg-card"
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="receiverId" value={receiverId} />
      <div className="flex items-start space-x-2">
        <Textarea
          ref={textareaRef}
          name="content"
          placeholder="Type your message..."
          required
          rows={1}
          className="flex-1 resize-none min-h-[40px] max-h-[120px] py-2 focus-visible:ring-1"
          onKeyDown={handleKeyDown}
          disabled={isPending}
          aria-describedby="content-error-pm"
        />
        <SubmitButton 
            size="icon" 
            className="h-10 w-10" 
            pendingText="" 
            disabled={isPending}
            aria-label="Send message"
        >
          <SendHorizonal className="h-5 w-5" />
        </SubmitButton>
      </div>
      {state?.errors?.content && (
        <p id="content-error-pm" className="text-sm font-medium text-destructive pt-1 pl-1">
          {state.errors.content[0]}
        </p>
      )}
       {state?.message && !state.success && !state.errors?.content && (
         <p className="text-sm font-medium text-destructive pt-1 pl-1">{state.message}</p>
      )}
    </form>
  );
}
