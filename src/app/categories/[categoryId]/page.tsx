
import { getTopicsByCategory, getCategoryById } from '@/lib/db'; // Changed from placeholder-data
import { TopicList } from '@/components/forums/TopicList';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { CreateTopicControl } from './_components/CreateTopicControl';

interface CategoryPageProps {
    params: { categoryId: string };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { categoryId } = params;
    const user = await getCurrentUser();
    const [category, topics] = await Promise.all([
        getCategoryById(categoryId),
        getTopicsByCategory(categoryId),
    ]);

    if (!category) {
        notFound();
    }

    return (
        <div className="space-y-6">
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

             <Separator />

            <CreateTopicControl categoryId={categoryId} user={user} />

            <div>
                 <h2 className="text-xl sm:text-2xl font-semibold mb-4">Topics</h2>
                <TopicList topics={topics} />
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const category = await getCategoryById(params.categoryId);
  return {
    title: category ? `${category.name} - ForumLite` : 'Category Not Found',
  };
}
