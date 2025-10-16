import Link from 'next/link';
import type { Category } from '@/lib/types';
import { getAllSiteSettings } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Folder, Clock, UserCircle } from 'lucide-react'; // Using Folder icon for category
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';

interface CategoryListProps {
    categories: Category[];
}

function groupByHeaders(flat: Category[]): { headers: (Category & { forums: Category[] })[], orphans: Category[] } {
    const byId = new Map<string, Category>();
    flat.forEach(c => byId.set(c.id, c));
    const headers: (Category & { forums: Category[] })[] = flat
        .filter(c => c.type === 'category' && !c.parentId)
        .map(c => ({ ...c, forums: [] }));
    const headersById = new Map(headers.map(h => [h.id, h] as const));
    const orphans: Category[] = [];
    for (const c of flat) {
        if (c.type === 'forum') {
            const parent = c.parentId ? headersById.get(c.parentId) : undefined;
            if (parent) parent.forums.push(c);
            else orphans.push(c);
        }
    }
    return { headers, orphans };
}

function renderForumCard(category: Category, siteSettings: any) {
    return (
        <Card key={category.id} className="hover:shadow-md transition-all duration-200 border border-border/60 hover:border-primary/40 bg-background/50 hover:bg-background">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
                {/* Forum Info Section */}
                <Link href={`/categories/${siteSettings.seo_friendly_urls_enabled ? category.slug : category.id}`} className="block group transition-all duration-200 ease-in-out md:border-r md:border-border/30">
                    <CardHeader className="pb-3 flex flex-row items-start gap-4 space-y-0 p-4">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg font-semibold group-hover:text-primary leading-tight">
                                {category.name}
                            </CardTitle>
                            {category.description && (
                                <CardDescription className="text-sm pt-1 line-clamp-2">
                                    {category.description}
                                </CardDescription>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0 pl-16 p-4">
                        <div className="text-xs text-muted-foreground flex items-center space-x-4">
                            <span className="flex items-center gap-1" title="Topics">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {category.topicCount} Topics
                            </span>
                            <span className="flex items-center gap-1" title="Posts">
                                <MessageSquare className="h-3.5 w-3.5 opacity-70" /> 
                                {category.postCount} Posts
                            </span>
                        </div>
                    </CardContent>
                </Link>

                {/* Last Post Section */}
                <div className="p-4 text-xs text-muted-foreground">
                    {category.lastPost ? (
                        <div className="flex items-start gap-3">
                            <Link href={`/users/${category.lastPost.authorUsername}`} className="flex-shrink-0 block" title={`View ${category.lastPost.authorUsername}'s profile`}>
                                <Avatar className="h-8 w-8 border border-border/50">
                                    <AvatarImage src={category.lastPost.authorAvatarUrl || `https://avatar.vercel.sh/${category.lastPost.authorUsername}.png?size=32`} alt={category.lastPost.authorUsername} data-ai-hint="user avatar small"/>
                                    <AvatarFallback className="text-xs">{category.lastPost.authorUsername?.charAt(0)?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="min-w-0 flex-1">
                                <Link href={`/topics/${siteSettings.seo_friendly_urls_enabled ? (category.lastPost.topicSlug || category.lastPost.topicId) : category.lastPost.topicId}#post-${category.lastPost.id}`} className="font-semibold text-foreground/90 hover:text-primary line-clamp-1 break-all block mb-1" title={category.lastPost.topicTitle}>
                                    {category.lastPost.topicTitle}
                                </Link>
                                <div className="flex items-center gap-1 text-muted-foreground/80 mb-1">
                                    <UserCircle className="h-3 w-3" />
                                    <Link href={`/users/${category.lastPost.authorUsername}`} className="hover:underline" title={`View ${category.lastPost.authorUsername}'s profile`}>
                                        {category.lastPost.authorUsername}
                                    </Link>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground/80">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(category.lastPost.createdAt), { addSuffix: true })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center md:text-left py-2">
                            <p className="italic text-muted-foreground/70">No posts yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

export async function CategoryList({ categories }: CategoryListProps) {
    const siteSettings = await getAllSiteSettings();
    if (!categories || categories.length === 0) {
        return <p className="text-muted-foreground mt-4 text-center py-10">No categories found.</p>;
    }

    const { headers, orphans } = groupByHeaders(categories);
    return (
        <div className="space-y-8">
            {headers.map((header) => (
                <div key={header.id} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    {/* Category Header - Now acts as a container header */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Folder className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">{header.name}</h3>
                            {header.description && (
                                <span className="text-sm text-muted-foreground hidden sm:block">
                                    {header.description}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Forums Container */}
                    <div className="p-4">
                        {header.forums.length === 0 ? (
                            <div className="text-center py-8">
                                <Folder className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">No forums in this category yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {header.forums.map(f => renderForumCard(f, siteSettings))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            
            {orphans.length > 0 && (
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-muted/60 to-muted/40 border-b border-border px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Folder className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-foreground">Ungrouped Forums</h3>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="space-y-3">
                            {orphans.map(f => renderForumCard(f, siteSettings))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
