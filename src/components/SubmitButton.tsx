"use client";

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps extends ButtonProps {
  pendingText?: string;
}

export function SubmitButton({ children, pendingText = "Submitting...", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" disabled={pending || props.disabled} aria-disabled={pending || props.disabled}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
