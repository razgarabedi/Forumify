import { getTopicsByCategory, getCategoryById } from '@/lib/placeholder-data'; // Using placeholder
import { TopicList } from '@/components/forums/TopicList';
import { TopicForm } from '@/components/forms/TopicForm';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, LogIn, UserPlus } from 'lucide-react'; // Added login/register icons
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator'; // Import Separator

interface CategoryPageProps {
    params: { categoryId: string };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { categoryId } = params;
    // Fetch user first to ensure cookie context is reliably accessed
    const user = await getCurrentUser();
    // console.log('[CategoryPage] Current User:', user?.id); // Debug log
    const [category, topics] = await Promise.all([
        getCategoryById(categoryId),
        getTopicsByCategory(categoryId),
    ]);

    if (!category) {
        notFound(); // Render 404 if category doesn't exist
    }

    return (
        <div className="space-y-6">
            {/* Back Button and Category Title */}
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                 <Button variant="outline" size="sm" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
                    </Link>
                </Button>
                <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold">{category.name}</h1>
                    {category.description && (
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{category.description}</p>
                    )}
                </div>
            </div>

             <Separator /> {/* Separator for visual structure */}

            {/* Topic Form or Login Prompt */}
            {user ? (
                 <TopicForm categoryId={categoryId} />
            ) : (
                 <Alert className="border-primary/30 bg-primary/5">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Login Required</AlertTitle>
                    <AlertDescription>
                        You need to login or register to start a new topic.
                         <div className="flex gap-2 mt-2">
                            <Button size="sm" asChild>
                               <Link href="/login">
                                   <LogIn className="mr-1 h-4 w-4"/> Login
                                </Link>
                            </Button>
                            <Button size="sm" variant="secondary" asChild>
                               <Link href="/register">
                                   <UserPlus className="mr-1 h-4 w-4"/> Register
                                </Link>
                             </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Topic List */}
            <div>
                 <h2 className="text-xl sm:text-2xl font-semibold mb-4">Topics</h2>
                <TopicList topics={topics} />
            </div>
        </div>
    );
}

// Optional: Add metadata generation
export async function generateMetadata({ params }: CategoryPageProps) {
  const category = await getCategoryById(params.categoryId);
  return {
    title: category ? `${category.name} - ForumLite` : 'Category Not Found',
  };
}
