import { getCategories } from '@/lib/placeholder-data'; // Using placeholder
import { CategoryList } from '@/components/forums/CategoryList';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { getCurrentUser } from '@/lib/actions/auth';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function Home() {
  const categories = await getCategories();
  const user = await getCurrentUser();

  return (
    <div className="space-y-8">
      <Card className="bg-secondary border-none shadow-sm">
        <CardHeader>
           <CardTitle className="text-2xl font-bold">Welcome to ForumLite!</CardTitle>
           <CardDescription>Browse categories below or start a new discussion.</CardDescription>
        </CardHeader>
      </Card>

      {user?.isAdmin && <CategoryForm />}

      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Forum Categories</h2>
        <CategoryList categories={categories} />
      </div>
    </div>
  );
}
