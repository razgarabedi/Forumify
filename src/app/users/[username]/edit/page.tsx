
'use client';
import React, { useEffect, useActionState, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUserProfileAction } from '@/lib/actions/auth';
import type { User, ActionResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/SubmitButton';
import { Loader2, UserCog, UploadCloud, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image'; // For image preview

const initialState: ActionResponse = {
    success: false,
    message: '',
    errors: {},
};

interface EditProfileFormProps {
    user: User;
}

function EditProfileForm({ user: initialUser }: EditProfileFormProps) {
    const [state, formAction, isPending] = useActionState(updateUserProfileAction, initialState);
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imagePreview, setImagePreview] = useState<string | null>(initialUser.avatarUrl || null);
    const [imageFile, setImageFile] = useState<File | null>(null); // To store the actual file if needed for more complex logic
    const [removeCurrentImage, setRemoveCurrentImage] = useState(false);


    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({
                    title: 'Success',
                    description: state.message,
                });
                router.push(`/users/${initialUser.username}`);
                router.refresh(); 
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: state.message || 'An error occurred.',
                });
            }
        }
    }, [state, toast, router, initialUser.username]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files[0]) {
            const file = files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ variant: "destructive", title: "File too large", description: "Avatar image must be smaller than 2MB." });
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
                toast({ variant: "destructive", title: "Invalid file type", description: "Please upload a JPG, PNG, GIF, or WEBP image." });
                return;
            }
            setImageFile(file);
            setRemoveCurrentImage(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageFile(null);
        setRemoveCurrentImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };
    
    const wrappedFormAction = (formData: FormData) => {
        // avatarUrl is the key expected by the server action's Zod schema
        if (imagePreview && imagePreview !== initialUser.avatarUrl) { // New image or changed from existing
            formData.set('avatarUrl', imagePreview);
        } else if (removeCurrentImage) { // Marked for removal
            formData.set('avatarUrl', '');
        } else if (initialUser.avatarUrl && !imagePreview && !removeCurrentImage) { // No new image, not removed, but original existed and then preview was cleared (e.g. by mistake)
             // This case means the user cleared a preview of a new image but didn't explicitly remove the original.
             // We should resend the original image URL if it exists.
             formData.set('avatarUrl', initialUser.avatarUrl);
        } else if (!initialUser.avatarUrl && !imagePreview && !removeCurrentImage) {
            // No initial avatar, no new preview, not marked for removal - send empty or undefined
            formData.set('avatarUrl', '');
        }
        // If imagePreview matches initialUser.avatarUrl and not marked for removal,
        // it means the existing avatar is kept. The defaultValue on other inputs handles sending it.
        // But for avatar, since it's not a direct input, we ensure it's explicitly set or cleared.

        formAction(formData);
    };


    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border border-border">
            <CardHeader>
                <CardTitle className="flex items-center text-xl sm:text-2xl">
                    <UserCog className="mr-2 h-6 w-6 text-primary" /> Edit Your Profile
                </CardTitle>
                <CardDescription>Update your personal information. Click save when you're done.</CardDescription>
            </CardHeader>
            <form action={wrappedFormAction}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="avatarFile">Avatar</Label>
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20 border">
                                <AvatarImage src={imagePreview || undefined} alt={initialUser.username} data-ai-hint="avatar preview"/>
                                <AvatarFallback className="text-2xl">{initialUser.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    <UploadCloud className="mr-2 h-4 w-4" /> Change Avatar
                                </Button>
                                <Input
                                    id="avatarFile"
                                    name="avatarFile" // Not directly used by server action, but good for forms
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    className="hidden"
                                />
                                {imagePreview && (
                                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveImage} className="text-destructive hover:text-destructive/80">
                                        <XCircle className="mr-2 h-4 w-4" /> Remove Avatar
                                    </Button>
                                )}
                            </div>
                        </div>
                        {state.errors?.avatarUrl && (
                            <p id="avatarUrl-error" className="text-sm font-medium text-destructive">{state.errors.avatarUrl[0]}</p>
                        )}
                         <p className="text-xs text-muted-foreground">Max 2MB. JPG, PNG, GIF, WEBP accepted.</p>
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
                                type="text" // Keep as text for prefixing logic, Zod handles URL validation
                                defaultValue={initialUser.websiteUrl?.replace(/^https?:\/\//, '') || ''} // Show without prefix
                                placeholder="yourwebsite.com"
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
                            type="text" // Keep as text
                            defaultValue={initialUser.socialMediaUrl?.replace(/^https?:\/\//, '') || ''} // Show without prefix
                            placeholder="socialmedia.com/yourprofile"
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
                    <SubmitButton pendingText="Saving..." disabled={isPending}>Save Changes</SubmitButton>
                </CardFooter>
            </form>
        </Card>
    );
}


export default function EditUserProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            setLoading(true);
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login'); 
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
        return <p className="text-center text-destructive">Could not load user profile for editing.</p>;
    }

    return (
        <div className="py-8">
            <EditProfileForm user={user} />
        </div>
    );
}

