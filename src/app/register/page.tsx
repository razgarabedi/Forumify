import { RegisterForm } from '@/components/forms/RegisterForm';
import { getCurrentUser } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';

export default async function RegisterPage() {
     // Redirect if already logged in
    const user = await getCurrentUser();
    if (user) {
        redirect('/');
    }

    return (
        <div className="flex justify-center items-center py-12">
            <RegisterForm />
        </div>
    );
}
