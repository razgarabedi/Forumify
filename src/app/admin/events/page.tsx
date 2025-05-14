
import { getEvents } from "@/lib/db";
import { EventForm } from "./_components/EventForm";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { EventActions } from "./_components/EventActions";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function AdminEventsPage() {
  let events = [];
  let error: string | null = null;
  try {
    events = await getEvents(); // Get all events, sorted by date
  } catch (e: any) {
    error = "Failed to load events. " + e.message;
    console.error(error);
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Event & Webinar Management</h1>
      </div>
      <p className="text-muted-foreground">Create, view, and manage forum events and webinars.</p>

      <EventForm />

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Error Loading Events</h3>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!error && (
        <>
          <h2 className="text-xl font-semibold mt-8 pt-4 border-t">Existing Events & Webinars</h2>
          <div className="border rounded-lg shadow-sm overflow-x-auto">
            <Table>
              <TableCaption>A list of all scheduled events and webinars.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[80px]">Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-right w-[100px] px-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <Badge variant={event.type === 'event' ? 'secondary' : 'outline'}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(event.date), 'PP')}</TableCell>
                    <TableCell>{event.time}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate" title={event.description || ''}>
                      {event.description || '-'}
                    </TableCell>
                    <TableCell>
                      {event.link ? (
                        <Link href={event.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[150px]" title={event.link}>
                          {event.link}
                        </Link>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right px-3">
                      <EventActions event={event} />
                    </TableCell>
                  </TableRow>
                ))}
                {events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                      No events or webinars found. Create one above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
