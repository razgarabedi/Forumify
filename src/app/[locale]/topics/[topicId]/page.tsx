
import { getTopicById } from '@/lib/db';
import { getPostsByTopic } from '@/lib/actions/forums';
import { PostList } from '@/components/forums/PostList';
import { PostForm } from '@/components/forms/PostForm';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, MessageSquare, UserCircle, CalendarDays, LogIn, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';


interface TopicPageProps {
    params: { topicId: string; locale: string };
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const topic = await getTopicById(params.topicId);
  const t = await getTranslations({locale: params.locale, namespace: 'Metadata'});
  
  const siteName = t('siteName');
  const title = topic ? `${topic.title} - ${siteName}` : `Topic Not Found - ${siteName}`;
  const description = topic?.firstPostContentSnippet || 'View the discussion on this topic.';
  const imageUrl = topic?.firstPostImageUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/og-default.png`;
  const slug = topic?.slug || ''; // Fallback to empty string if slug is undefined
  const canonicalUrl = topic ? `/${params.locale}/topics/${topic.id}/${slug}` : `/${params.locale}/topics/${params.topicId}`;


  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: title,
      description: description,
      type: 'article',
      url: canonicalUrl,
      siteName: siteName,
      images: [{ url: imageUrl, alt: topic?.title || 'Forum Topic Image' }],
      authors: topic?.author?.username ? [topic.author.username] : [],
      publishedTime: topic?.createdAt.toISOString(),
      modifiedTime: topic?.lastActivity.toISOString(), // Or a specific updated_at if available
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
      // creator: topic?.author?.username ? `@${topic.author.username}` : undefined, // If you have Twitter handles
    },
  };
}


export default async function TopicPage({ params }: TopicPageProps) {
    const { topicId, locale } = params; // Added locale
    const user = await getCurrentUser();
    const [topic, initialPosts] = await Promise.all([
        getTopicById(topicId),
        getPostsByTopic(topicId),
    ]);

    if (!topic) {
        notFound();
    }

    const categorySlug = topic.category?.slug || topic.categoryId;


    return (
        <div className="space-y-6">
            <div>
                 {topic.category && (
                     <Button variant="outline" size="sm" asChild className="mb-4">
                        <Link href={`/${locale}/categories/${topic.categoryId}/${categorySlug}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {topic.category.name}
                        </Link>
                    </Button>
                 )}
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{topic.title}</h1>
                 <div className="text-sm text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                        <UserCircle className="h-4 w-4"/> Started by: <strong>{topic.author?.username ?? 'Unknown'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                         <CalendarDays className="h-4 w-4"/> {format(new Date(topic.createdAt), 'PPP')}
                    </span>
                     <span className="flex items-center gap-1">
                         <MessageSquare className="h-4 w-4"/> {topic.postCount ?? initialPosts.length} posts
                    </span>
                </div>
            </div>

            <Separator />

            <PostList initialPosts={initialPosts} topicId={topicId} currentUser={user} />

            {user ? (
                 <div id="post-form-container">
                    <PostForm topicId={topicId} />
                 </div>
            ) : (
                 <Alert id="post-form-container" className="border-primary/30 bg-primary/5">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Login Required</AlertTitle>
                    <AlertDescription>
                        You need to login or register to reply to this topic.
                         <div className="flex gap-2 mt-2">
                             <Button size="sm" asChild>
                               <Link href={`/${locale}/login?redirect=/${params.locale}/topics/${topicId}`}>
                                   <LogIn className="mr-1 h-4 w-4"/> Login
                                </Link>
                            </Button>
                            <Button size="sm" variant="secondary" asChild>
                               <Link href={`/${locale}/register?redirect=/${params.locale}/topics/${topicId}`}>
                                   <UserPlus className="mr-1 h-4 w-4"/> Register
                                </Link>
                             </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

