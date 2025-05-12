"use client";

import { useState } from 'react';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { deleteCategoryAction, updateCategoryAction } from '@/lib/actions/admin'; // Create these actions
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';


interface CategoryActionsProps {
  category: Category;
}

export function CategoryActions({ category }: CategoryActionsProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editDescription, setEditDescription] = useState(category.description || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDeleteCategory = async () => {
    setIsDeleting(true);
    try {
       const result = await deleteCategoryAction(category.id);
       if (result.success) {
            toast({
                title: "Success",
                description: `Category "${category.name}" deleted successfully.`,
            });
            // Revalidation handled by action
       } else {
            throw new Error(result.message || 'Failed to delete category.');
       }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not delete category.",
        });
     } finally {
         setIsDeleting(false);
     }
  };

  const handleEditCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsEditing(true);
    try {
        const result = await updateCategoryAction(category.id, { name: editName, description: editDescription });
        if (result.success) {
             toast({
                 title: "Success",
                 description: `Category "${result.category?.name}" updated successfully.`,
             });
             setIsEditModalOpen(false); // Close modal on success
             // Revalidation handled by action
        } else {
             // Handle validation errors specifically
             if (result.errors) {
                 const errorMessages = Object.values(result.errors).flat().join(' ');
                 throw new Error(errorMessages || result.message || 'Validation failed.');
             }
             throw new Error(result.message || 'Failed to update category.');
        }
     } catch (error: any) {
         toast({
             variant: "destructive",
             title: "Error",
             description: error.message || "Could not update category.",
         });
      } finally {
          setIsEditing(false);
      }
   };

  return (
    <>
    <AlertDialog>
     <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
                <DialogTrigger asChild>
                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* Prevent auto close */}
                        <Edit className="mr-2 h-4 w-4" /> Edit Category
                    </DropdownMenuItem>
                </DialogTrigger>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={isDeleting} onSelect={(e) => e.preventDefault()}>
                         {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" /> }
                         {isDeleting ? 'Deleting...' : 'Delete Category'}
                    </DropdownMenuItem>
                </AlertDialogTrigger>
            </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Dialog Content */}
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>Edit Category: {category.name}</DialogTitle>
            <DialogDescription>
                Make changes to the category details here. Click save when you're done.
            </DialogDescription>
            </DialogHeader>
             <form onSubmit={handleEditCategory}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                        Name
                        </Label>
                        <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="col-span-3"
                        required
                        minLength={3}
                        maxLength={100}
                        disabled={isEditing}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                        Description
                        </Label>
                        <Textarea
                        id="description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="col-span-3"
                        maxLength={255}
                         placeholder="(Optional)"
                         disabled={isEditing}
                         rows={3}
                        />
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isEditing}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isEditing}>
                         {isEditing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null }
                         {isEditing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
             </form>
        </DialogContent>
     </Dialog>


        {/* Alert Dialog Content for Delete Confirmation */}
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the category
                <strong className="px-1">{category.name}</strong>
                 and all topics and posts within it.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteCategory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
            >
                 {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null }
                 {isDeleting ? 'Deleting...' : 'Yes, delete category'}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>
     </>
  );
}