import { getGroups, getUserGroups, findUserById } from "@/lib/db";
import { AlertTriangle, Users, ArrowLeft } from "lucide-react";
import { UserGroupManager } from "./_components/UserGroupManager";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: 'User Groups - Admin Panel',
};

interface Props {
  params: {
    userId: string;
  };
}

export default async function UserGroupsPage({ params }: Props) {
  let error: string | null = null;
  let user: Awaited<ReturnType<typeof findUserById>> = null;
  let groups: Awaited<ReturnType<typeof getGroups>> = [];
  let userGroups: Awaited<ReturnType<typeof getUserGroups>> = [];

  try {
    const { userId } = await params;
    [user, groups, userGroups] = await Promise.all([
      findUserById(userId),
      getGroups(),
      getUserGroups(userId)
    ]);

    if (!user) {
      error = "User not found";
    }
  } catch (e: any) {
    error = "Failed to load user or groups. " + e.message;
    console.error(error);
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">User Groups</h1>
        </div>
        
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Error Loading</h3>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">User Groups</h1>
            <p className="text-muted-foreground">Manage groups for {user.username}</p>
          </div>
        </div>
        <Link href="/admin/users">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>

      <UserGroupManager 
        user={user} 
        allGroups={groups} 
        userGroups={userGroups} 
      />
    </div>
  );
}
