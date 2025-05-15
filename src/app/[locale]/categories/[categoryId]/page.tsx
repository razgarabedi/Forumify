
import { getTopicsByCategory, getCategoryById } from '@/lib/db';
import { TopicList } from '@/components/forums/TopicList';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { CreateTopicControl } from './_components/CreateTopicControl';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

interface CategoryPageProps {
    params: { categoryId: string; locale: string; };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryById(params.categoryId);
  const t = await getTranslations({locale: params.locale, namespace: 'Metadata'});
  
  const siteName = t('siteName');
  const title = category ? `${category.name} - ${siteName}` : `Category Not Found - ${siteName}`;
  const description = category ? category.description || `Discussions in the ${category.name} category.` : 'This category could not be found.';
  const slug = category?.slug || ''; // Fallback to empty string if slug is undefined
  const canonicalUrl = category ? `/${params.locale}/categories/${category.id}/${slug}` : `/${params.locale}/categories/${params.categoryId}`;


  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: title,
      description: description,
      type: 'website', // Or 'article' if more appropriate for a category page
      url: canonicalUrl,
      siteName: siteName,
      // You might want a default category image or specific images per category
      // images: [{ url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/default-category-image.png` }],
    },
    twitter: {
      card: 'summary',
      title: title,
      description: description,
      // images: [`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/default-category-image.png`],
    },
  };
}


export default async function CategoryPage({ params }: CategoryPageProps) {
    const { categoryId, locale } = params; // Added locale here
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
                    <Link href={`/${locale}/`}> {/* Make sure root link is locale-aware */}
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
