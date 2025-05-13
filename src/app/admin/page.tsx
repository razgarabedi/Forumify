
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getTotalUserCount, getTotalCategoryCount, getTotalTopicCount, getTotalPostCount } from "@/lib/db"; // Changed from placeholder-data
import { Users, LayoutGrid, MessageSquare, Library } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [userCount, categoryCount, topicCount, postCount] = await Promise.all([
    getTotalUserCount(),
    getTotalCategoryCount(),
    getTotalTopicCount(),
    getTotalPostCount(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">Overview of the forum statistics and management tools.</p>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">
               <Link href="/admin/users" className="hover:underline text-primary">Manage Users</Link>
            </p>
          </CardContent>
        </Card>
         <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount}</div>
             <p className="text-xs text-muted-foreground">
               <Link href="/admin/categories" className="hover:underline text-primary">Manage Categories</Link>
            </p>
          </CardContent>
        </Card>
         <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topicCount}</div>
            {/* Link to topic management if added */}
            {/* <p className="text-xs text-muted-foreground">View Topics</p> */}
          </CardContent>
        </Card>
         <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postCount}</div>
             {/* Link to post management if added */}
            {/* <p className="text-xs text-muted-foreground">View Posts</p> */}
          </CardContent>
        </Card>
      </div>

      {/* Add quick links or other admin info here */}
       <Card className="shadow-sm">
        <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
            <Link href="/admin/users" className="text-primary hover:underline">Manage Users</Link>
            <Link href="/admin/categories" className="text-primary hover:underline">Manage Categories</Link>
            {/* Add links to future admin features */}
        </CardContent>
       </Card>

    </div>
  );
}
