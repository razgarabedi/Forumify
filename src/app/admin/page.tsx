
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getTotalUserCount, getTotalCategoryCount, getTotalTopicCount, getTotalPostCount, getAllSiteSettings } from "@/lib/db";
import { Users, LayoutGrid, MessageSquare, Library, Info, ExternalLink } from "lucide-react";
import Link from "next/link";
import pkg from "../../../package.json";

export default async function AdminDashboardPage() {
  const [userCount, categoryCount, topicCount, postCount, siteSettings] = await Promise.all([
    getTotalUserCount(),
    getTotalCategoryCount(),
    getTotalTopicCount(),
    getTotalPostCount(),
    getAllSiteSettings(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">Overview of the forum status, resources, and management tools.</p>

      {/* Version and Update Status (placeholder) */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Version & Updates</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">Current version: <span className="font-medium">{pkg.version}</span></div>
          <div className="text-xs text-muted-foreground">Automatic update checks coming soon.</div>
        </CardContent>
      </Card>

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

      {/* Resources & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/admin/users" className="text-primary hover:underline">Manage Users</Link>
            <Link href="/admin/categories" className="text-primary hover:underline">Manage Categories</Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Helpful Links</CardTitle>
            <CardDescription>Documentation and community support.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {siteSettings?.links_docs_url ? (
              <a href={siteSettings.links_docs_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="h-4 w-4" /> Docs
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">Docs link not configured yet.</span>
            )}
            {siteSettings?.links_community_url ? (
              <a href={siteSettings.links_community_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="h-4 w-4" /> Community
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">Community link not configured yet.</span>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
