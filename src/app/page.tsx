
import { getCategories, getEvents, getAllSiteSettings } from '@/lib/db';
import type { Category } from '@/lib/types';
import { CategoryList } from '@/components/forums/CategoryList';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { getCurrentUser } from '@/lib/actions/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, UserPlus, AlertTriangle } from 'lucide-react';
import { EventsWidget } from '@/components/widgets/EventsWidget'; // Import the widget

export default async function Home() {
  let categories: Category[] = [];
  let pageError: string | null = null;
  let upcomingEvents = [];
  let siteSettings;

  try {
    // Fetch all data in parallel
    [categories, upcomingEvents, siteSettings] = await Promise.all([
      getCategories(),
      getEvents(3), // Fetch, for example, the next 3 events for the widget
      getAllSiteSettings(),
    ]);
  } catch (error: any) {
    pageError = "An unexpected error occurred while loading forum data. Please check server logs or try again later.";
    console.error("Error loading data on homepage:", error);
    // Fallback for site settings if fetch fails, so page can render
    siteSettings = {
        events_widget_enabled: true, // Default to enabled
        events_widget_position: 'above_categories',
        events_widget_detail_level: 'full',
    };
  }

  const user = await getCurrentUser();
  const eventsWidgetEnabled = siteSettings.events_widget_enabled;
  const eventsWidgetPosition = siteSettings.events_widget_position;
  const eventsWidgetDetailLevel = siteSettings.events_widget_detail_level;

  const renderEventsWidget = () => {
    if (eventsWidgetEnabled && upcomingEvents.length > 0) {
      return <EventsWidget events={upcomingEvents} detailLevel={eventsWidgetDetailLevel} />;
    }
    return null;
  };

  return (
    <div className="space-y-8">
       <Card className="bg-gradient-to-r from-primary/10 via-background to-background border border-primary/20 shadow-sm">
        <CardHeader>
           <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Welcome to ForumLite!</CardTitle>
           <CardDescription className="text-base text-foreground/80 mt-1">
               The simple, modern platform for community discussions.
            </CardDescription>
        </CardHeader>
         {!user && (
             <CardContent className="flex flex-col sm:flex-row gap-3">
                 <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4"/> Login
                    </Link>
                </Button>
                 <Button variant="secondary" asChild>
                     <Link href="/register">
                         <UserPlus className="mr-2 h-4 w-4"/> Register
                     </Link>
                 </Button>
             </CardContent>
         )}
      </Card>

      {eventsWidgetPosition === 'above_categories' && renderEventsWidget()}

      {user?.isAdmin && !pageError && <CategoryForm />}

      <div>
         <h2 className="text-xl sm:text-2xl font-semibold mb-4 border-b pb-2 text-foreground">Forum Categories</h2>
        {pageError ? (
          <Card className="mt-4 border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center text-lg">
                <AlertTriangle className="mr-2 h-5 w-5" /> Application Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive-foreground">{pageError}</p>
              <p className="text-xs text-muted-foreground mt-2">If the database is unavailable, the application may be using placeholder data. Check server console logs for details.</p>
            </CardContent>
          </Card>
        ) : (
          <CategoryList categories={categories} />
        )}
      </div>

      {eventsWidgetPosition === 'below_categories' && renderEventsWidget()}
    </div>
  );
}
