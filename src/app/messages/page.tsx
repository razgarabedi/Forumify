
import { fetchConversationsAction } from '@/lib/actions/privateMessages';
import { ConversationListClient } from './_components/ConversationListClient';
import { getCurrentUser } from '@/lib/actions/auth'; // To pass current user ID
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox } from 'lucide-react';

export default async function MessagesPage() {
  // Fetch initial conversations on the server
  const initialConversations = await fetchConversationsAction();
  const currentUser = await getCurrentUser(); // Needed for client component to identify "other participant"

  if (!currentUser) {
    // This should ideally be caught by the layout, but as a safeguard:
    return <p>Please log in to view your messages.</p>;
  }

  return (
    <div>
      {initialConversations.length === 0 ? (
        <Card className="text-center py-10 sm:py-16 border-dashed border-border">
          <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-3 w-fit">
              <Inbox className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4 text-xl font-semibold">No Conversations Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              When you start a conversation with another user, it will appear here.
            </CardDescription>
            {/* Optionally, add a button to browse users or start a new message if a compose page exists */}
          </CardContent>
        </Card>
      ) : (
        <ConversationListClient initialConversations={initialConversations} currentUserId={currentUser.id} />
      )}
    </div>
  );
}
