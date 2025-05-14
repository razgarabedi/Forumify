
import type { EventDetails, EventWidgetDetailLevel } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarClock, Info, ExternalLink, Video, Zap } from 'lucide-react'; // Zap for Event, Video for Webinar

interface EventsWidgetProps {
  events: EventDetails[];
  detailLevel: EventWidgetDetailLevel;
}

export function EventsWidget({ events, detailLevel }: EventsWidgetProps) {
  if (!events || events.length === 0) {
    return null; // Don't render if no events
  }

  const isCompact = detailLevel === 'compact';

  return (
    <Card className="my-6 shadow-md border border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Upcoming Events & Webinars</CardTitle>
        </div>
        {!isCompact && (
            <CardDescription>Stay updated with our latest scheduled activities.</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => {
          const EventIcon = event.type === 'webinar' ? Video : Zap;
          return (
            <div key={event.id} className={`p-3 rounded-md border ${isCompact ? 'border-border/50' : 'border-border bg-muted/20 hover:bg-muted/40 transition-colors'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-md font-semibold flex items-center gap-1.5">
                     <EventIcon className={`h-4 w-4 ${event.type === 'webinar' ? 'text-blue-500' : 'text-orange-500'} flex-shrink-0`} />
                    {event.link && !isCompact ? (
                        <Link href={event.link} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary">
                            {event.title}
                        </Link>
                    ) : (
                        event.title
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(event.date), 'EEEE, MMMM d, yyyy')} at {event.time}
                  </p>
                </div>
                {isCompact && event.link && (
                     <Button variant="outline" size="sm" asChild className="mt-2 sm:mt-0 sm:ml-auto">
                        <Link href={event.link} target="_blank" rel="noopener noreferrer">
                            <Info className="h-3.5 w-3.5" />
                            <span className="sr-only">More Info</span>
                        </Link>
                    </Button>
                )}
              </div>
              {!isCompact && event.description && (
                <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
              )}
              {!isCompact && event.link && (
                <Button variant="link" size="sm" asChild className="px-0 mt-2">
                  <Link href={event.link} target="_blank" rel="noopener noreferrer">
                    View Details <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
         {events.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming events or webinars scheduled.</p>
        )}
      </CardContent>
    </Card>
  );
}
