
import { getTopicById } from '@/lib/db'; // Changed from placeholder-data
import { getPostsByTopic } from '@/lib/actions/forums'; // Action uses db.ts internally
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

interface TopicPageProps {
    params: { topicId: string };
}

export default async function TopicPage({ params }: TopicPageProps) {
    const { topicId } = params;
    const user = await getCurrentUser();
    const [topic, initialPosts] = await Promise.all([
        getTopicById(topicId),
        getPostsByTopic(topicId), // This action already uses db.ts
    ]);

    if (!topic) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                 {topic.category && (
                     <Button variant="outline" size="sm" asChild className="mb-4">
                        <Link href={`/categories/${topic.categoryId}`}>
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
    );
}

export async function generateMetadata({ params }: TopicPageProps) {
  const topic = await getTopicById(params.topicId);
  return {
    title: topic ? `${topic.title} - ForumLite` : 'Topic Not Found',
  };
}
