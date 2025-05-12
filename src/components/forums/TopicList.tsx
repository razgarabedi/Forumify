import Link from 'next/link';
import type { Topic } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TopicListProps {
    topics: Topic[];
}

export function TopicList({ topics }: TopicListProps) {
    if (!topics || topics.length === 0) {
        return <p className="text-muted-foreground mt-6">No topics found in this category yet.</p>;
    }

    return (
        <div className="space-y-3">
            {topics.map((topic) => (
                <Link href={`/topics/${topic.id}`} key={topic.id} className="block group">
                    <Card className="hover:shadow-md transition-shadow duration-200 border border-border hover:border-primary/50">
                       <CardHeader className="flex flex-row items-start space-x-4 p-4">
                            <Avatar className="h-10 w-10 border">
                                {/* Placeholder image - replace with actual user avatar logic */}
                                <AvatarImage src={`https://avatar.vercel.sh/${topic.author?.username || topic.authorId}.png`} alt={topic.author?.username} data-ai-hint="user avatar"/>
                                <AvatarFallback>{topic.author?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                               <CardTitle className="text-base font-medium group-hover:text-primary leading-tight">
                                    {topic.title}
                                </CardTitle>
                                 <CardDescription className="text-xs text-muted-foreground mt-1">
                                    Started by {topic.author?.username || 'Unknown User'}
                                    <span className="mx-1">·</span>
                                    {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
                                </CardDescription>
                            </div>
                        </CardHeader>
                         <CardFooter className="text-xs text-muted-foreground flex justify-between items-center p-4 pt-0">
                            <div className="flex items-center space-x-3">
                                 <span className="flex items-center">
                                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                     {topic.postCount ?? 0} Posts
                                </span>
                            </div>
                             <div className="flex items-center">
                                 <Clock className="h-3.5 w-3.5 mr-1" />
                                 Last activity: {formatDistanceToNow(new Date(topic.lastActivity), { addSuffix: true })}
                             </div>
                        </CardFooter>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
