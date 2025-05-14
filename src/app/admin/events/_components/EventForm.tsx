
"use client";

import { useActionState, useEffect, useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createEventAction, updateEventAction } from '@/lib/actions/admin';
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import { PlusCircle, Edit } from 'lucide-react';
import type { EventDetails, ActionResponse, EventType } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from 'date-fns';
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventFormProps {
  event?: EventDetails | null; // For editing
  onSuccess?: () => void; // Callback on successful submission
}

const initialState: ActionResponse = {
    message: '',
    errors: {},
    success: false,
};

export function EventForm({ event, onSuccess }: EventFormProps) {
  const isEditing = !!event;
  const action = isEditing ? updateEventAction.bind(null, event.id) : createEventAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    event?.date ? new Date(event.date) : undefined
  );

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({ title: "Success", description: state.message });
        formRef.current?.reset();
        setSelectedDate(undefined); // Reset date picker
        if (onSuccess) onSuccess();
      } else {
        toast({ variant: "destructive", title: "Error", description: state.message || "An error occurred." });
      }
    }
  }, [state, toast, onSuccess]);

  useEffect(() => {
    if (event?.date) {
        setSelectedDate(new Date(event.date));
    } else {
        setSelectedDate(undefined);
    }
  }, [event]);

  return (
    <Card className="mt-6 mb-8 shadow-md border border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl">
          {isEditing ? <Edit className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
          {isEditing ? 'Edit Event/Webinar' : 'Create New Event/Webinar'}
        </CardTitle>
        <CardDescription>
          {isEditing ? 'Update the details of the event or webinar.' : 'Add a new event or webinar to the schedule.'}
        </CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={event?.title} required disabled={isPending} aria-describedby="title-error-event" />
            {state?.errors?.title && <p id="title-error-event" className="text-sm font-medium text-destructive pt-1">{state.errors.title[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={event?.type || 'event'} disabled={isPending}>
                <SelectTrigger id="type" aria-describedby="type-error-event">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.type && <p id="type-error-event" className="text-sm font-medium text-destructive pt-1">{state.errors.type[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Input type="hidden" name="date" value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""} />
              {state?.errors?.date && <p id="date-error-event" className="text-sm font-medium text-destructive pt-1">{state.errors.date[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time (HH:MM)</Label>
              <Input id="time" name="time" type="time" defaultValue={event?.time} required disabled={isPending} aria-describedby="time-error-event" />
              {state?.errors?.time && <p id="time-error-event" className="text-sm font-medium text-destructive pt-1">{state.errors.time[0]}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" name="description" defaultValue={event?.description} rows={3} maxLength={500} disabled={isPending} aria-describedby="description-error-event" />
            {state?.errors?.description && <p id="description-error-event" className="text-sm font-medium text-destructive pt-1">{state.errors.description[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link (Optional, e.g., for webinar joining)</Label>
            <Input id="link" name="link" type="url" defaultValue={event?.link} placeholder="https://example.com/event" disabled={isPending} aria-describedby="link-error-event" />
            {state?.errors?.link && <p id="link-error-event" className="text-sm font-medium text-destructive pt-1">{state.errors.link[0]}</p>}
          </div>

        </CardContent>
        <CardFooter>
          <SubmitButton pendingText={isEditing ? "Saving..." : "Creating..."} disabled={isPending}>
            {isEditing ? 'Save Changes' : 'Create Event'}
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
