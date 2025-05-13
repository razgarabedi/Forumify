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

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      <p className="text-muted-foreground">View and manage all registered users.</p>

      {/* Add overflow-x-auto for responsiveness */}
      <div className="border rounded-lg shadow-sm overflow-x-auto">
        <Table>
          <TableCaption>A list of all registered users.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] px-3">Avatar</TableHead> {/* Adjust padding */}
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="whitespace-nowrap">Joined Date</TableHead> {/* Prevent wrap */}
              <TableHead>Role</TableHead>
              <TableHead className="text-right px-3">Actions</TableHead> {/* Adjust padding */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => ( // Remove potential whitespace here
              <TableRow key={user.id}>
                <TableCell className="px-3"> {/* Adjust padding */}
                   <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png?size=36`} alt={user.username} data-ai-hint="user avatar"/>
                    <AvatarFallback>{user.username?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell> {/* Muted color */}
                <TableCell className="whitespace-nowrap">{format(new Date(user.createdAt), 'PP')}</TableCell> {/* Prevent wrap */}
                <TableCell>
                  {user.isAdmin ? (
                    <Badge variant="destructive">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right px-3"> {/* Adjust padding */}
                  <UserActions user={user} />
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && ( // Remove potential whitespace here
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
