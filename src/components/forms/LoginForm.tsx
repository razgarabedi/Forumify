"use client";

import { useActionState, useEffect } from 'react'; // Import useActionState from react
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/lib/actions/auth";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import { LogIn } from 'lucide-react';

const initialState = {
    message: null,
    errors: {},
    success: false,
};

export function LoginForm() {
    // Use useActionState from react instead of useFormState from react-dom
    const [state, formAction] = useActionState(login, initialState);
    const { toast } = useToast();
    const router = useRouter();

     useEffect(() => {
        if (state?.message && !state.success) {
             toast({
                variant: "destructive",
                title: "Login Failed",
                description: state.message,
            });
        }
         if (state?.message && state.success) {
             toast({
                title: "Success",
                description: state.message,
            });
            // Redirect to home page on successful login
             router.push('/');
        }
    }, [state, toast, router]);


    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><LogIn className="mr-2 h-5 w-5"/> Login</CardTitle>
                <CardDescription>Access your ForumLite account.</CardDescription>
            </CardHeader>
            <form action={formAction}>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            aria-describedby="email-error"
                        />
                         {state?.errors?.email && (
                            <p id="email-error" className="text-sm font-medium text-destructive">
                                {state.errors.email[0]}
                            </p>
                        )}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                             minLength={6}
                            aria-describedby="password-error"
                        />
                         {state?.errors?.password && (
                            <p id="password-error" className="text-sm font-medium text-destructive">
                                {state.errors.password[0]}
                            </p>
                        )}
                    </div>
                     {state?.message && !state.success && !state.errors && (
                         <p className="text-sm font-medium text-destructive">{state.message}</p>
                     )}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4">
                    <SubmitButton className="w-full" pendingText="Logging in...">Login</SubmitButton>
                     <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Button variant="link" className="p-0 h-auto" asChild>
                           <Link href="/register" className="text-accent font-medium hover:underline">Register here</Link>
                        </Button>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
