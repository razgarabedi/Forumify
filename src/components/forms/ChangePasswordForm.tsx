
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import { changePasswordAction } from '@/lib/actions/auth';
import type { ActionResponse } from '@/lib/types';

const initialState: ActionResponse = {
    success: false,
    message: '',
    errors: {},
};

export function ChangePasswordForm() {
    const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({
                    title: 'Success',
                    description: state.message,
                });
                formRef.current?.reset(); // Reset form on success
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: state.message || 'An error occurred.',
                });
            }
        }
    }, [state, toast]);

    return (
        <form action={formAction} ref={formRef} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    disabled={isPending}
                    aria-describedby="currentPassword-error"
                />
                {state.errors?.currentPassword && (
                    <p id="currentPassword-error" className="text-sm font-medium text-destructive">
                        {state.errors.currentPassword[0]}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={6}
                    disabled={isPending}
                    aria-describedby="newPassword-error"
                />
                {state.errors?.newPassword && (
                    <p id="newPassword-error" className="text-sm font-medium text-destructive">
                        {state.errors.newPassword[0]}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    required
                    minLength={6}
                    disabled={isPending}
                    aria-describedby="confirmNewPassword-error"
                />
                {state.errors?.confirmNewPassword && (
                    <p id="confirmNewPassword-error" className="text-sm font-medium text-destructive">
                        {state.errors.confirmNewPassword[0]}
                    </p>
                )}
            </div>
            
            {state.message && !state.success && !state.errors?.currentPassword && !state.errors?.newPassword && !state.errors?.confirmNewPassword && (
                 <p className="text-sm font-medium text-destructive">{state.message}</p>
            )}

            <div>
                <SubmitButton pendingText="Updating Password..." disabled={isPending}>
                    Update Password
                </SubmitButton>
            </div>
        </form>
    );
}
