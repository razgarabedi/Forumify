import { getAllUsers } from "@/lib/placeholder-data";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { UserActions } from './_components/UserActions'; // Component for actions (toggle admin, delete)
import Link from "next/link"; // Import Link

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      <p className="text-muted-foreground">View and manage all registered users.</p>

      <div className="border rounded-lg shadow-sm overflow-x-auto">
        <Table>
          <TableCaption>A list of all registered users.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] px-3">Avatar</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="whitespace-nowrap">Joined Date</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right px-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="px-3">
                  <Link href={`/users/${user.username}`} title={`View ${user.username}'s profile`}>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.username}.png?size=36`} alt={user.username} data-ai-hint="user avatar"/>
                      <AvatarFallback>{user.username?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                    </Avatar>
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/users/${user.username}`} className="hover:underline" title={`View ${user.username}'s profile`}>
                    {user.username}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="whitespace-nowrap">{format(new Date(user.createdAt), 'PP')}</TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Badge variant="destructive">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right px-3">
                  <UserActions user={user} />
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                        No users found.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
