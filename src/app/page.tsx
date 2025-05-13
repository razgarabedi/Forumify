
import { getCategories } from '@/lib/db';
import type { Category } from '@/lib/types';
import { CategoryList } from '@/components/forums/CategoryList';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { getCurrentUser } from '@/lib/actions/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, UserPlus, AlertTriangle } from 'lucide-react'; // Added AlertTriangle

export default async function Home() {
  let categories: Category[] = [];
  let pageError: string | null = null; // Changed from dbError to pageError for clarity

  try {
    categories = await getCategories();
    // If getCategories falls back to placeholder data, it will log warnings in db.ts
    // but won't throw an error here unless placeholder.getCategories itself throws.
  } catch (error: any) {
    // This catch block would now primarily catch errors from placeholder.getCategories,
    // or truly unexpected errors from the db.ts wrapper if its try/catch fails.
    pageError = "An unexpected error occurred while loading forum categories. Please check server logs or try again later.";
    console.error("Error loading categories on homepage:", error);
  }

  const user = await getCurrentUser();

  return (
    <div className="space-y-8">
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

      {user?.isAdmin && !pageError && <CategoryForm />}

      <div>
         <h2 className="text-xl sm:text-2xl font-semibold mb-4 border-b pb-2 text-foreground">Forum Categories</h2>
        {pageError ? (
          <Card className="mt-4 border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center text-lg">
                <AlertTriangle className="mr-2 h-5 w-5" /> Application Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive-foreground">{pageError}</p>
              <p className="text-xs text-muted-foreground mt-2">If the database is unavailable, the application may be using placeholder data. Check server console logs for details.</p>
            </CardContent>
          </Card>
        ) : (
          <CategoryList categories={categories} />
        )}
      </div>
    </div>
  );
}

