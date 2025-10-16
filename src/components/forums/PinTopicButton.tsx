"use client";

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Pin } from 'lucide-react';
import { togglePinTopic } from '@/lib/actions/forums';
import type { ActionResponse } from '@/lib/types';

interface PinTopicButtonProps {
  topicId: string;
  isPinned: boolean;
  onPinChange?: (newPinned: boolean) => void;
}

const initialActionState: ActionResponse = { 
  success: false, 
  message: '' 
};

export function PinTopicButton({ topicId, isPinned, onPinChange }: PinTopicButtonProps) {
  const [state, formAction, isPending] = useActionState(togglePinTopic, initialActionState);

  const handleSubmit = async (formData: FormData) => {
    const newPinned = formData.get('pin') === 'true';
    onPinChange?.(newPinned);
    formAction(formData);
  };

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="topicId" value={topicId} />
      <input type="hidden" name="pin" value={(!isPinned).toString()} />
      <Button 
        type="submit" 
        variant="outline" 
        size="xs" 
        className="h-6 px-2"
        disabled={isPending}
      >
        <Pin className="h-3 w-3 mr-1" /> 
        {isPinned ? 'Unpin' : 'Pin'}
      </Button>
    </form>
  );
}
