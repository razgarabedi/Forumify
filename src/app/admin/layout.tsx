import { type ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Users, LayoutGrid, Settings, ArrowLeft } from 'lucide-react'; // Changed icons slightly
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button'; // Import Button

export const metadata = {
  title: 'Admin Panel - ForumLite',
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
     console.warn("Unauthorized access attempt to /admin prevented.");
     redirect('/');
  }

  return (
     // Use grid for better responsiveness control
    <div className="grid md:grid-cols-[250px_1fr] gap-6 lg:gap-8 min-h-[calc(100vh-160px)]"> {/* Reduced vertical padding assumption */}
      <aside className="w-full md:w-auto flex-shrink-0 md:sticky md:top-20 md:h-[calc(100vh-120px)]"> {/* Make sidebar sticky */}
         <Card className="shadow-sm border border-border h-full">
           <CardContent className="p-4 h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4 px-2">Admin Menu</h2>
            <nav className="flex flex-col space-y-1 flex-grow">
               {/* Use Button for nav items */}
               <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/admin">
                        <Home className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
               </Button>
               <Button variant="ghost" className="justify-start" asChild>
                   <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" /> User Management
                   </Link>
               </Button>
               <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/admin/categories">
                    <LayoutGrid className="mr-2 h-4 w-4" /> Category Management
                  </Link>
               </Button>
               {/* Add more admin links as needed */}
               {/* Spacer */}
               <div className="flex-grow"></div>
               <Separator className="my-2"/>
               <Button variant="ghost" className="justify-start text-muted-foreground" asChild>
                 <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forum
                 </Link>
               </Button>
            </nav>
          </CardContent>
        </Card>
      </aside>
      <main className="flex-1 py-2 md:py-0"> {/* Adjust padding */}
        {children}
      </main>
    </div>
  );
}
