'use client';
import { useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUserProfileAction } from '@/lib/actions/auth'; // Create this action
import type { User, ActionResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/SubmitButton';
import { Loader2, UserCog } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const initialState: ActionResponse = {
    success: false,
    message: '',
    errors: {},
};

interface EditProfileFormProps {
    user: User;
}

function EditProfileForm({ user: initialUser }: EditProfileFormProps) {
    const [state, formAction] = useActionState(updateUserProfileAction, initialState);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({
                    title: 'Success',
                    description: state.message,
                });
                router.push(`/users/${initialUser.username}`); // Redirect to profile page on success
                 router.refresh(); // Force refresh to get new data
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: state.message,
                });
            }
        }
    }, [state, toast, router, initialUser.username]);

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border border-border">
            <CardHeader>
                <CardTitle className="flex items-center text-xl sm:text-2xl">
                    <UserCog className="mr-2 h-6 w-6 text-primary" /> Edit Your Profile
                </CardTitle>
                <CardDescription>Update your personal information. Click save when you're done.</CardDescription>
            </CardHeader>
            <form action={formAction}>
                <CardContent className="space-y-6">
                     <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20 border">
                            <AvatarImage src={initialUser.avatarUrl || `https://avatar.vercel.sh/${initialUser.username}.png?size=80`} alt={initialUser.username} data-ai-hint="user avatar large"/>
                            <AvatarFallback className="text-2xl">{initialUser.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 flex-1">
                            <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                            <Input
                                id="avatarUrl"
                                name="avatarUrl"
                                type="url"
                                defaultValue={initialUser.avatarUrl || ''}
                                placeholder="https://example.com/avatar.png"
                                aria-describedby="avatarUrl-error"
                            />
                            {state.errors?.avatarUrl && (
                                <p id="avatarUrl-error" className="text-sm font-medium text-destructive">{state.errors.avatarUrl[0]}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" name="username" defaultValue={initialUser.username} disabled className="bg-muted/50"/>
                            <p className="text-xs text-muted-foreground">Username cannot be changed.</p>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" defaultValue={initialUser.email} disabled className="bg-muted/50"/>
                             <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="aboutMe">About Me</Label>
                        <Textarea
                            id="aboutMe"
                            name="aboutMe"
                            defaultValue={initialUser.aboutMe || ''}
                            placeholder="Tell us a little about yourself..."
                            rows={4}
                            maxLength={500}
                            aria-describedby="aboutMe-error"
                        />
                        {state.errors?.aboutMe && (
                            <p id="aboutMe-error" className="text-sm font-medium text-destructive">{state.errors.aboutMe[0]}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="location">Location (Optional)</Label>
                            <Input
                                id="location"
                                name="location"
                                defaultValue={initialUser.location || ''}
                                placeholder="City, Country"
                                maxLength={100}
                                aria-describedby="location-error"
                            />
                             {state.errors?.location && (
                                <p id="location-error" className="text-sm font-medium text-destructive">{state.errors.location[0]}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                            <Input
                                id="websiteUrl"
                                name="websiteUrl"
                                type="url"
                                defaultValue={initialUser.websiteUrl || ''}
                                placeholder="https://yourwebsite.com"
                                maxLength={200}
                                aria-describedby="websiteUrl-error"
                            />
                            {state.errors?.websiteUrl && (
                                <p id="websiteUrl-error" className="text-sm font-medium text-destructive">{state.errors.websiteUrl[0]}</p>
                            )}
                        </div>
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="socialMediaUrl">Social Media Link (Optional)</Label>
                        <Input
                            id="socialMediaUrl"
                            name="socialMediaUrl"
                            type="url"
                            defaultValue={initialUser.socialMediaUrl || ''}
                            placeholder="https://socialmedia.com/yourprofile"
                            maxLength={200}
                            aria-describedby="socialMediaUrl-error"
                        />
                        {state.errors?.socialMediaUrl && (
                            <p id="socialMediaUrl-error" className="text-sm font-medium text-destructive">{state.errors.socialMediaUrl[0]}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="signature">Signature (Optional)</Label>
                        <Input
                            id="signature"
                            name="signature"
                            defaultValue={initialUser.signature || ''}
                            placeholder="Your forum signature"
                            maxLength={150}
                            aria-describedby="signature-error"
                        />
                        {state.errors?.signature && (
                            <p id="signature-error" className="text-sm font-medium text-destructive">{state.errors.signature[0]}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton pendingText="Saving...">Save Changes</SubmitButton>
                </CardFooter>
            </form>
        </Card>
    );
}


export default function EditUserProfilePage() {
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            setLoading(true);
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login'); // Redirect if not logged in
            } else {
                setUser(currentUser);
            }
            setLoading(false);
        }
        fetchUser();
    }, [router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Loading your profile...</p>
            </div>
        );
    }

    if (!user) {
        // Should have been redirected, but as a fallback:
        return <p className="text-center text-destructive">Could not load user profile for editing.</p>;
    }

    return (
        <div className="py-8">
            <EditProfileForm user={user} />
        </div>
    );
}
