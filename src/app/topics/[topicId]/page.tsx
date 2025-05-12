import { getTopicById } from '@/lib/placeholder-data'; // Using placeholder
import { getPostsByTopic } from '@/lib/actions/forums'; // Use action to fetch posts
import { PostList } from '@/components/forums/PostList';
import { PostForm } from '@/components/forms/PostForm';
import { getCurrentUser } from '@/lib/actions/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, MessageSquare, UserCircle, CalendarDays, LogIn, UserPlus } from 'lucide-react'; // Added more icons
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator'; // Import Separator

interface TopicPageProps {
    params: { topicId: string };
}

export default async function TopicPage({ params }: TopicPageProps) {
    const { topicId } = params;
     // Fetch user first to ensure cookie context is reliably accessed
    const user = await getCurrentUser();
    const [topic, initialPosts] = await Promise.all([
        getTopicById(topicId),
        getPostsByTopic(topicId),
    ]);

    if (!topic) {
        notFound(); // Render 404 if topic doesn't exist
    }

    return (
        <div className="space-y-6">
             {/* Back Button and Topic Title */}
            <div>
                 {topic.category && (
                     <Button variant="outline" size="sm" asChild className="mb-4">
                        <Link href={`/categories/${topic.categoryId}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {topic.category.name}
                        </Link>
                    </Button>
                 )}
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{topic.title}</h1>
                 {/* Enhanced Metadata */}
                 <div className="text-sm text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                        <UserCircle className="h-4 w-4"/> Started by: <strong>{topic.author?.username ?? 'Unknown'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                         <CalendarDays className="h-4 w-4"/> {format(new Date(topic.createdAt), 'PPP')} {/* Simpler date format */}
                    </span>
                     <span className="flex items-center gap-1">
                         <MessageSquare className="h-4 w-4"/> {topic.postCount ?? initialPosts.length} posts
                    </span>
                </div>
            </div>

            <Separator /> {/* Separator for visual structure */}

            {/* Post List - Now requires client component for edit state */}
            <PostList initialPosts={initialPosts} topicId={topicId} currentUser={user} />


            {/* Reply Form or Login Prompt */}
            {user ? (
                 <div id="post-form-container"> {/* Add an ID for scrolling into view when editing */}
                    <PostForm topicId={topicId} />
                 </div>
            ) : (
                 <Alert id="post-form-container" className="border-primary/30 bg-primary/5"> {/* Add ID here too */}
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Login Required</AlertTitle>
                    <AlertDescription>
                        You need to login or register to reply to this topic.
                         <div className="flex gap-2 mt-2">
                             <Button size="sm" asChild>
                               <Link href={`/login?redirect=/topics/${topicId}`}> {/* Add redirect */}
                                   <LogIn className="mr-1 h-4 w-4"/> Login
                                </Link>
                            </Button>
                            <Button size="sm" variant="secondary" asChild>
                               <Link href={`/register?redirect=/topics/${topicId}`}> {/* Add redirect */}
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


// Optional: Add metadata generation
export async function generateMetadata({ params }: TopicPageProps) {
  const topic = await getTopicById(params.topicId);
  return {
    title: topic ? `${topic.title} - ForumLite` : 'Topic Not Found',
  };
}
