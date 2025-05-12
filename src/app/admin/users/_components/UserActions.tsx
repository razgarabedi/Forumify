"use client";

import { useState } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import { toggleAdminStatus, deleteUserAction } from '@/lib/actions/admin'; // Create these actions
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';


interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const { toast } = useToast();
  const [isToggleLoading, setIsToggleLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleToggleAdmin = async () => {
    setIsToggleLoading(true);
    try {
      const result = await toggleAdminStatus(user.id, !user.isAdmin);
      if (result.success) {
        toast({
          title: "Success",
          description: `User ${user.username} ${result.newStatus ? 'promoted to' : 'demoted from'} Admin.`,
        });
      } else {
        throw new Error(result.message || 'Failed to toggle admin status.');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not update user role.",
      });
    } finally {
        setIsToggleLoading(false);
    }
  };

  const handleDeleteUser = async () => {
     setIsDeleteLoading(true);
    try {
       const result = await deleteUserAction(user.id);
       if (result.success) {
            toast({
                title: "Success",
                description: `User ${user.username} deleted successfully.`,
            });
            // Revalidation is handled by the action
       } else {
            throw new Error(result.message || 'Failed to delete user.');
       }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not delete user.",
        });
     } finally {
         setIsDeleteLoading(false);
     }
  };


  return (
     <AlertDialog>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
             <DropdownMenuItem onClick={handleToggleAdmin} disabled={isToggleLoading}>
                {isToggleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (user.isAdmin ? <ShieldOff className="mr-2 h-4 w-4"/> : <ShieldCheck className="mr-2 h-4 w-4"/>) }
                {isToggleLoading ? 'Updating...' : (user.isAdmin ? 'Demote to User' : 'Promote to Admin')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={isDeleteLoading}>
                     {isDeleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" /> }
                     {isDeleteLoading ? 'Deleting...' : 'Delete User'}
                </DropdownMenuItem>
            </AlertDialogTrigger>
        </DropdownMenuContent>
        </DropdownMenu>

         {/* Alert Dialog Content for Delete Confirmation */}
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user
                <strong className="px-1">{user.username}</strong>
                and all associated data (like posts and topics they created).
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleteLoading}
            >
                 {isDeleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null }
                {isDeleteLoading ? 'Deleting...' : 'Yes, delete user'}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>
  );
}