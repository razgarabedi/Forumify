
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';
import { getCurrentUser } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { KeyRound, UserCog } from 'lucide-react'; // Added UserCog

export const metadata = {
  title: 'Account Settings - ForumLite',
};

export default async function SettingsPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login?redirect=/settings');
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center space-x-3 mb-6">
                <UserCog className="h-8 w-8 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold">Account Settings</h1>
            </div>
            
            <Card className="shadow-md border border-border">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-semibold">
                        <KeyRound className="mr-2 h-5 w-5 text-primary" /> Change Password
                    </CardTitle>
                    <CardDescription>Update your account password. Choose a strong, unique password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChangePasswordForm />
                </CardContent>
            </Card>

            {/* Placeholder for other settings sections - e.g., Email Management */}
            {/* 
            <Card className="shadow-md border border-border">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-semibold">
                         <Mail className="mr-2 h-5 w-5 text-primary" /> Manage Email Address
                    </CardTitle>
                    <CardDescription>Update the email address associated with your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Email management feature coming soon.</p>
                </CardContent>
            </Card>
            */}

             {/* Placeholder for other settings sections - e.g., Notification Preferences */}
            {/* 
            <Card className="shadow-md border border-border">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-semibold">
                         <BellRing className="mr-2 h-5 w-5 text-primary" /> Notification Preferences
                    </CardTitle>
                    <CardDescription>Control how you receive notifications from the forum.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Notification preferences feature coming soon.</p>
                </CardContent>
            </Card>
            */}
        </div>
    );
}
