
import { getTopicById, getTopicBySlug, getAllSiteSettings } from '@/lib/db'; // Changed from placeholder-data
import { getPostsByTopic } from '@/lib/actions/forums'; // Action uses db.ts internally
import { PostList } from '@/components/forums/PostList';
import { PostForm } from '@/components/forms/PostForm';
import { PostFormMobile } from '@/components/forms/PostFormMobile';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, MessageSquare, UserCircle, CalendarDays, LogIn, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { generateFriendlyUrl } from '@/lib/seo';

interface TopicPageProps {
    params: { topicId: string };
}

export default async function TopicPage({ params }: TopicPageProps) {
    const { topicId } = await params;
    const siteSettings = await getAllSiteSettings();
    const user = await getCurrentUser();
    const topic = siteSettings.seo_friendly_urls_enabled
        ? (await getTopicBySlug(topicId)) || (await getTopicById(topicId))
        : await getTopicById(topicId);
    const initialPosts = await getPostsByTopic(topic?.id || topicId); // use resolved id

    if (!topic) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Main Content */}
            <div className="space-y-6">
                <div>
                     {topic.category && (
                         <Button variant="outline" size="sm" asChild className="mb-4">
                            <Link href={generateFriendlyUrl('category', topic.category, siteSettings)}>
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

                {/* Expose censor rules to client via window to avoid extra fetch */}
                <script
                  dangerouslySetInnerHTML={{ __html: `window.__FORUMLITE_CENSOR__ = ${JSON.stringify(siteSettings.core_censor_words || '')};` }}
                />
                <PostList initialPosts={initialPosts} topicId={topicId} currentUser={user} />

                {!user && (
                     <Alert id="post-form-container" className="border-primary/30 bg-primary/5">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary">Login Required</AlertTitle>
                        <AlertDescription>
                            You need to login or register to reply to this topic.
                             <div className="flex gap-2 mt-2">
                                 <Button size="sm" asChild>
                                   <Link href={`/login?redirect=/topics/${topicId}`}>
                                       <LogIn className="mr-1 h-4 w-4"/> Login
                                    </Link>
                                </Button>
                                <Button size="sm" variant="secondary" asChild>
                                   <Link href={`/register?redirect=/topics/${topicId}`}>
                                       <UserPlus className="mr-1 h-4 w-4"/> Register
                                    </Link>
                                 </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: TopicPageProps) {
  const { topicId } = await params;
  const siteSettings = await getAllSiteSettings();
  const topic = siteSettings.seo_friendly_urls_enabled
    ? (await getTopicBySlug(topicId)) || (await getTopicById(topicId))
    : await getTopicById(topicId);
  return {
    title: topic ? `${topic.title} - Rexerium Forum` : 'Topic Not Found',
  };
}
