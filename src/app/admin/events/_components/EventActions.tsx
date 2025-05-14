
"use client";

import { useState } from 'react';
import type { EventDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, Loader2 } from 'lucide-react';
import { deleteEventAction } from '@/lib/actions/admin';
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
  AlertDialogTrigger, // Added this import
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { EventForm } from './EventForm';

interface EventActionsProps {
  event: EventDetails;
}

export function EventActions({ event }: EventActionsProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
       const result = await deleteEventAction(event.id);
       if (result.success) {
            toast({ title: "Success", description: `Event "${event.title}" deleted successfully.` });
       } else {
            throw new Error(result.message || 'Failed to delete event.');
       }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Could not delete event." });
     } finally {
         setIsDeleting(false);
     }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    // Revalidation is handled by the update action, no need for specific revalidation here
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
                <DropdownMenuItem onSelect={(e) => {e.preventDefault(); setIsEditModalOpen(true); }}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Event
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={isDeleting} onSelect={(e) => e.preventDefault()}>
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Edit Dialog Content */}
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Event: {event.title}</DialogTitle>
              <DialogDescription>
                Make changes to the event details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <EventForm event={event} onSuccess={handleEditSuccess} />
          </DialogContent>
        </Dialog>

        {/* Alert Dialog Content for Delete Confirmation */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event/webinar:
              <strong className="px-1">{event.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              {isDeleting ? 'Deleting...' : 'Yes, delete event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
