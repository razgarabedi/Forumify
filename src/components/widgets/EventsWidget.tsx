
import type { EventDetails, EventWidgetDetailLevel } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarClock, Info, ExternalLink, Video, Zap, MapPin, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventsWidgetProps {
  events: EventDetails[];
  detailLevel: EventWidgetDetailLevel;
  widgetTitle?: string; // Added for custom title
}

export function EventsWidget({ events, detailLevel, widgetTitle = "Upcoming Events & Webinars" }: EventsWidgetProps) {
  if (!events || events.length === 0) {
    return null; // Don't render if no events
  }

  const isCompact = detailLevel === 'compact';

  return (
    <Card className="my-6 shadow-lg border border-border/60 bg-card">
      <CardHeader className="pb-4 pt-5">
        <div className="flex items-center gap-2.5">
          <CalendarClock className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl font-semibold">{widgetTitle}</CardTitle>
        </div>
        {!isCompact && (
            <CardDescription className="text-sm">Stay updated with our latest scheduled activities.</CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn("space-y-3", isCompact ? "pb-4" : "pb-5")}>
        {events.map((event) => {
          const EventIcon = event.type === 'webinar' ? Video : Zap;
          const iconColor = event.type === 'webinar' ? 'text-blue-500' : 'text-orange-500';
          const borderColor = event.type === 'webinar' ? 'border-blue-500/70' : 'border-orange-500/70';

          return (
            <div 
              key={event.id} 
              className={cn(
                `p-3 rounded-lg border flex flex-col sm:flex-row sm:items-start gap-3 transition-all duration-150 ease-in-out`,
                isCompact ? 'border-border/50 hover:border-primary/50' : `bg-background shadow-sm hover:shadow-md ${borderColor} border-l-4`
              )}
            >
              <div className={cn("flex-shrink-0 flex items-center justify-center rounded-full h-10 w-10", 
                isCompact ? 'hidden' : (event.type === 'webinar' ? 'bg-blue-500/10' : 'bg-orange-500/10')
              )}>
                <EventIcon className={cn("h-5 w-5", iconColor)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className={cn("font-semibold flex items-center gap-1.5", isCompact ? "text-sm" : "text-base")}>
                        {isCompact && <EventIcon className={cn("h-4 w-4 flex-shrink-0", iconColor)} />}
                        {event.link && !isCompact ? (
                            <Link href={event.link} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary">
                                {event.title}
                            </Link>
                        ) : (
                            event.title
                        )}
                    </h3>
                    {isCompact && event.link && (
                        <Button variant="ghost" size="icon" asChild className="h-7 w-7 flex-shrink-0 ml-2">
                            <Link href={event.link} target="_blank" rel="noopener noreferrer" aria-label="More info about event">
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        </Button>
                    )}
                </div>
                <div className={cn("text-xs text-muted-foreground mt-1 flex items-center gap-1.5", isCompact && "gap-1")}>
                    <CalendarClock className="h-3.5 w-3.5 flex-shrink-0"/> 
                    <span>{format(new Date(event.date), 'eee, MMM d, yyyy')}</span>
                    <ClockIcon className="h-3.5 w-3.5 flex-shrink-0 ml-1"/> 
                    <span>{event.time}</span>
                </div>

                {!isCompact && event.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{event.description}</p>
                )}
                {!isCompact && event.link && (
                  <Button variant="link" size="sm" asChild className="px-0 mt-1.5 text-xs">
                    <Link href={event.link} target="_blank" rel="noopener noreferrer">
                      View Details <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
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
