import Link from 'next/link';
import type { Topic } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, UserCircle } from 'lucide-react'; // Added UserCircle
import { formatDistanceToNow } from 'date-fns';

interface TopicListProps {
    topics: Topic[];
}

export function TopicList({ topics }: TopicListProps) {
    if (!topics || topics.length === 0) {
        return <p className="text-muted-foreground mt-6 text-center py-10">No topics found in this category yet.</p>;
    }

    return (
        <div className="space-y-3">
            {topics.map((topic) => (
                <Link href={`/topics/${topic.id}`} key={topic.id} className="block group transition-all duration-200 ease-in-out transform hover:-translate-y-0.5">
                    {/* Adjusted card styling */}
                    <Card className="hover:shadow-lg transition-shadow duration-200 border border-border hover:border-primary/60 bg-card hover:bg-muted/50">
                       <CardHeader className="flex flex-row items-start space-x-3 p-4"> {/* Adjusted spacing */}
                            <Avatar className="h-10 w-10 border flex-shrink-0">
                                <AvatarImage src={`https://avatar.vercel.sh/${topic.author?.username || topic.authorId}.png?size=40`} alt={topic.author?.username} data-ai-hint="user avatar"/>
                                <AvatarFallback>{topic.author?.username?.charAt(0)?.toUpperCase() || 'T'}</AvatarFallback> {/* Use T for Topic fallback */}
                            </Avatar>
                            <div className="flex-1 min-w-0"> {/* Ensure text wraps */}
                               <CardTitle className="text-base font-medium group-hover:text-primary leading-snug line-clamp-2"> {/* Allow wrapping */}
                                    {topic.title}
                                </CardTitle>
                                 <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                                    <UserCircle className="h-3 w-3" />
                                    <span>{topic.author?.username || 'Unknown'}</span>
                                    <span className="mx-1">·</span>
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
                                </CardDescription>
                            </div>
                        </CardHeader>
                        {/* Use CardContent for stats to keep consistent padding */}
                         <CardContent className="text-xs text-muted-foreground flex flex-wrap justify-between items-center gap-x-4 gap-y-1 p-4 pt-0 pl-16"> {/* Align with title */}
                            <div className="flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {topic.postCount ?? 0} Posts
                            </div>
                             <div className="flex items-center gap-1">
                                 <Clock className="h-3.5 w-3.5" />
                                 <span>Last: {formatDistanceToNow(new Date(topic.lastActivity), { addSuffix: true })}</span>
                             </div>
                        </CardContent>
                         {/* Remove CardFooter if content is moved */}
                    </Card>
                </Link>
            ))}
        </div>
    );
}
