
import { getTopicsByCategory, getTopicsByCategorySorted, getCategoryById, getCategoryBySlug, getAllSiteSettings } from '@/lib/db'; // Changed from placeholder-data
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
    const { categoryId } = await params;
    const siteSettings = await getAllSiteSettings();
    const user = await getCurrentUser();
    const category = siteSettings.seo_friendly_urls_enabled
        ? (await getCategoryBySlug(categoryId)) || (await getCategoryById(categoryId))
        : await getCategoryById(categoryId);
    const topics = await getTopicsByCategorySorted(category?.id || categoryId, siteSettings.core_discussion_sorting || 'latest');

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
                    {category.parentId && (
                        <p className="text-xs text-muted-foreground mt-1">Subcategory of <Link className="underline" href={`/categories/${category.parentId}`}>parent</Link></p>
                    )}
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
  const { categoryId } = await params;
  const siteSettings = await getAllSiteSettings();
  const category = siteSettings.seo_friendly_urls_enabled
    ? (await getCategoryBySlug(categoryId)) || (await getCategoryById(categoryId))
    : await getCategoryById(categoryId);
  return {
    title: category ? `${category.name} - ForumLite` : 'Category Not Found',
  };
}
