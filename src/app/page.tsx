import { getCategories } from '@/lib/placeholder-data'; // Using placeholder
import { CategoryList } from '@/components/forums/CategoryList';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { getCurrentUser } from '@/lib/actions/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'; // Added CardContent
import { Button } from '@/components/ui/button'; // Added Button
import Link from 'next/link'; // Added Link
import { LogIn, UserPlus } from 'lucide-react'; // Added icons

export default async function Home() {
  const categories = await getCategories();
  const user = await getCurrentUser();

  return (
    <div className="space-y-8">
       {/* More engaging welcome card */}
       <Card className="bg-gradient-to-r from-primary/10 via-background to-background border border-primary/20 shadow-sm">
        <CardHeader>
           <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Welcome to ForumLite!</CardTitle>
           <CardDescription className="text-base text-foreground/80 mt-1">
               The simple, modern platform for community discussions.
            </CardDescription>
        </CardHeader>
         {!user && (
             <CardContent className="flex flex-col sm:flex-row gap-3">
                 <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4"/> Login
                    </Link>
                </Button>
                 <Button variant="secondary" asChild>
                     <Link href="/register">
                         <UserPlus className="mr-2 h-4 w-4"/> Register
                     </Link>
                 </Button>
             </CardContent>
         )}
      </Card>

      {/* Only show category form if user is admin */}
      {user?.isAdmin && <CategoryForm />}

      <div>
         <h2 className="text-xl sm:text-2xl font-semibold mb-4 border-b pb-2 text-foreground">Forum Categories</h2>
        <CategoryList categories={categories} />
      </div>
    </div>
  );
}
