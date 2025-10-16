import { RegisterForm } from '@/components/forms/RegisterForm';
import { getCurrentUser } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import { getAllSiteSettings } from '@/lib/db';

export default async function RegisterPage() {
     // Redirect if already logged in
    const user = await getCurrentUser();
    if (user) {
        redirect('/');
    }

    const siteSettings = await getAllSiteSettings();
    if (siteSettings.core_allow_signups === false) {
        redirect('/?error=registration_disabled');
    }

    return (
        <div className="flex justify-center items-center py-12">
            <RegisterForm />
        </div>
    );
}
