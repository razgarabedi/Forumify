import Link from 'next/link';
import type { Category } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Folder } from 'lucide-react'; // Using Folder icon for category

interface CategoryListProps {
    categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
    if (!categories || categories.length === 0) {
        return <p className="text-muted-foreground mt-4 text-center py-10">No categories found.</p>;
    }

    return (
        <div className="space-y-3"> {/* Reduced spacing */}
            {categories.map((category) => (
                <Link href={`/categories/${category.id}`} key={category.id} className="block group transition-all duration-200 ease-in-out transform hover:-translate-y-0.5">
                     {/* Adjusted card styling */}
                     <Card className="hover:shadow-lg transition-shadow duration-200 border border-border hover:border-primary/60 bg-card hover:bg-muted/50">
                        <CardHeader className="pb-3 flex flex-row items-start gap-4 space-y-0"> {/* Use flex for icon and text */}
                            <Folder className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <CardTitle className="text-lg font-semibold group-hover:text-primary leading-tight">
                                    {category.name}
                                </CardTitle>
                                {category.description && (
                                    <CardDescription className="text-sm pt-1 line-clamp-2"> {/* Limit description lines */}
                                        {category.description}
                                    </CardDescription>
                                )}
                             </div>
                        </CardHeader>
                        <CardContent className="pt-0 pl-14"> {/* Align content with title */}
                            <div className="text-xs text-muted-foreground flex items-center space-x-4">
                                <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                     {category.topicCount ?? 0} Topics
                                </span>
                                {/* Optionally add post count if available and useful */}
                                {/* <span className="flex items-center gap-1">
                                     <MessagesSquare className="h-3.5 w-3.5" />
                                     {category.postCount ?? 0} Posts
                                </span> */}
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
