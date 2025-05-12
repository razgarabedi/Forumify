import { getTopicById } from '@/lib/placeholder-data'; // Using placeholder
import { getPostsByTopic } from '@/lib/actions/forums'; // Use action to fetch posts
import { PostList } from '@/components/forums/PostList';
import { PostForm } from '@/components/forms/PostForm';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notFound } from 'next/navigation';
import { format } from 'date-fns';

interface TopicPageProps {
    params: { topicId: string };
}

export default async function TopicPage({ params }: TopicPageProps) {
    const { topicId } = params;
    const [topic, initialPosts, user] = await Promise.all([
        getTopicById(topicId),
        getPostsByTopic(topicId), // Fetch posts via action/server component logic
        getCurrentUser()
    ]);

    if (!topic) {
        notFound(); // Render 404 if topic doesn't exist
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
                <h1 className="text-3xl font-bold">{topic.title}</h1>
                <div className="text-sm text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                        Started by: <strong>{topic.author?.username ?? 'Unknown'}</strong>
                    </span>
                    <span>
                        Posted: {format(new Date(topic.createdAt), 'PPP p')}
                    </span>
                     <span className="flex items-center">
                         <MessageSquare className="h-4 w-4 mr-1"/> {topic.postCount ?? initialPosts.length} posts
                    </span>
                </div>
            </div>

            {/* Post List - Now requires client component for edit state */}
            <PostList initialPosts={initialPosts} topicId={topicId} currentUser={user} />


            {/* Reply Form */}
            {user ? (
                // Add an ID for scrolling into view when editing
                <div id="post-form-container">
                    <PostForm topicId={topicId} />
                 </div>
            ) : (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Login Required</AlertTitle>
                    <AlertDescription>
                        You need to <Link href="/login" className="font-medium text-primary hover:underline">login</Link> or <Link href="/register" className="font-medium text-primary hover:underline">register</Link> to reply to this topic.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}


// Optional: Add metadata generation
export async function generateMetadata({ params }: TopicPageProps) {
  const topic = await getTopicById(params.topicId);
  return {
    title: topic ? `${topic.title} - ForumLite` : 'Topic Not Found',
  };
}
