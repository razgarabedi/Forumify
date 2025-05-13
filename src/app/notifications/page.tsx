
import { getCurrentUser } from '@/lib/actions/auth';
import { fetchNotificationsAction, markAllNotificationsReadAction } from '@/lib/actions/notifications';
import { NotificationItem } from './_components/NotificationItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BellOff, CheckCheck, ExternalLink } from 'lucide-react'; // Added ExternalLink
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SubmitButton } from '@/components/SubmitButton'; 

export const metadata = {
  title: 'Notifications - ForumLite',
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?redirect=/notifications');
  }

  const notifications = await fetchNotificationsAction();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  async function handleMarkAllRead() {
    "use server";
    const result = await markAllNotificationsReadAction();
    if (!result.success) {
        console.error("Failed to mark all notifications as read:", result.message);
    }
    // Revalidation is handled by the action
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">All Notifications</h1>
        {notifications.length > 0 && unreadCount > 0 && (
          <form action={handleMarkAllRead}>
            <SubmitButton variant="outline" size="sm" pendingText="Marking...">
              <CheckCheck className="mr-2 h-4 w-4" /> Mark All as Read ({unreadCount})
            </SubmitButton>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center py-10 sm:py-16 border-dashed border-border">
          <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                <BellOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4 text-xl font-semibold">No Notifications Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              When someone mentions you (e.g., @{user.username}) in a post, you'll see it here.
            </CardDescription>
            <Button asChild className="mt-6">
              <Link href="/"> <ExternalLink className="mr-2 h-4 w-4" /> Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
}
