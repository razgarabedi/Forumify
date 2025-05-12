import Link from 'next/link';
import type { Category } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, BookOpen } from 'lucide-react'; // Using BookOpen for category icon

interface CategoryListProps {
    categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
    if (!categories || categories.length === 0) {
        return <p className="text-muted-foreground mt-4">No categories found.</p>;
    }

    return (
        <div className="space-y-4">
            {categories.map((category) => (
                <Link href={`/categories/${category.id}`} key={category.id} className="block group">
                    <Card className="hover:shadow-md transition-shadow duration-200 border border-border hover:border-primary/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold group-hover:text-primary flex items-center">
                               <BookOpen className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                {category.name}
                            </CardTitle>
                            {category.description && (
                                <CardDescription className="text-sm pt-1">
                                    {category.description}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground flex items-center space-x-4">
                                <span className="flex items-center">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                     {category.topicCount ?? 0} Topics
                                </span>
                                {/* Optionally add post count */}
                                {/* <span className="flex items-center">
                                     <MessagesSquare className="h-3 w-3 mr-1" /> // Example icon
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
