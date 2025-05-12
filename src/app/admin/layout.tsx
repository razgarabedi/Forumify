import { type ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Users, LayoutGrid, Settings, ShieldAlert } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Admin Panel - ForumLite',
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    // If user is not logged in or not an admin, redirect to home
    // Or show an access denied page
     // For simplicity, redirecting home. Consider a dedicated access denied page.
     console.warn("Unauthorized access attempt to /admin prevented.");
     redirect('/');
     // return (
     //   <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
     //      <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
     //      <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
     //      <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
     //      <Link href="/" className="mt-4 text-primary hover:underline">
     //          Go back to Home
     //      </Link>
     //   </div>
     // );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-200px)]">
      <aside className="w-full md:w-64 flex-shrink-0">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4 px-2">Admin Menu</h2>
            <nav className="flex flex-col space-y-1">
               {/* Use Button variant="ghost" for nav items */}
               <Link href="/admin" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                <Home className="mr-2 h-4 w-4" /> Dashboard
              </Link>
               <Link href="/admin/users" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                <Users className="mr-2 h-4 w-4" /> User Management
              </Link>
              <Link href="/admin/categories" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                <LayoutGrid className="mr-2 h-4 w-4" /> Category Management
              </Link>
               {/* Add more admin links as needed */}
               <Separator className="my-2"/>
               <Link href="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground">
                 <Home className="mr-2 h-4 w-4" /> Back to Forum
               </Link>
            </nav>
          </CardContent>
        </Card>
      </aside>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}