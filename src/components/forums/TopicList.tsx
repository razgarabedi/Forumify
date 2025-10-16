import type { Topic } from '@/lib/types';
import { getAllSiteSettings, checkPermissionForUser } from '@/lib/db';
import { getCurrentUser } from '@/lib/actions/auth';
import { TopicCard } from './TopicCard';

interface TopicListProps {
    topics: Topic[];
}

export async function TopicList({ topics }: TopicListProps) {
    const siteSettings = await getAllSiteSettings();
    const user = await getCurrentUser();
    const canPin = user ? await checkPermissionForUser(user.id, 'pin_topics') : false;
    
    if (!topics || topics.length === 0) {
        return <p className="text-muted-foreground mt-6 text-center py-10">No topics found in this category yet.</p>;
    }

    return (
        <div className="space-y-3">
            {topics.map((topic) => (
                <TopicCard 
                    key={topic.id} 
                    topic={topic} 
                    canPin={canPin} 
                    siteSettings={siteSettings} 
                />
            ))}
        </div>
    );
}