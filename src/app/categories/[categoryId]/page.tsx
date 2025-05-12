import { getTopicsByCategory, getCategoryById } from '@/lib/placeholder-data'; // Using placeholder
import { TopicList } from '@/components/forums/TopicList';
import { TopicForm } from '@/components/forms/TopicForm';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notFound } from 'next/navigation';


interface CategoryPageProps {
    params: { categoryId: string };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { categoryId } = params;
    // Fetch user first to ensure cookie context is reliably accessed
    const user = await getCurrentUser();
    const [category, topics] = await Promise.all([
        getCategoryById(categoryId),
        getTopicsByCategory(categoryId),
        // User fetch moved outside Promise.all
    ]);

    if (!category) {
        notFound(); // Render 404 if category doesn't exist
    }

    return (
        <div className="space-y-6">
            <div>
                <Button variant="outline" size="sm" asChild className="mb-4">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">{category.name}</h1>
                 {category.description && (
                     <p className="text-muted-foreground mt-1">{category.description}</p>
                )}
            </div>

            {user ? (
                 <TopicForm categoryId={categoryId} />
            ) : (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Login Required</AlertTitle>
                    <AlertDescription>
                        You need to <Link href="/login" className="font-medium text-primary hover:underline">login</Link> or <Link href="/register" className="font-medium text-primary hover:underline">register</Link> to start a new topic.
                    </AlertDescription>
                </Alert>
            )}

            <div>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Topics</h2>
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
