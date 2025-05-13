
import { fetchConversationsAction } from '@/lib/actions/privateMessages';
import { ConversationListClient } from './_components/ConversationListClient';
import { getCurrentUser } from '@/lib/actions/auth'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox } from 'lucide-react';
import { StartConversationForm } from './_components/StartConversationForm'; // Import the new form

export default async function MessagesPage() {
  const initialConversations = await fetchConversationsAction();
  const currentUser = await getCurrentUser(); 

  if (!currentUser) {
    return <p>Please log in to view your messages.</p>;
  }

  return (
    <div className="space-y-6">
      <StartConversationForm />

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
              When you start a conversation with another user, or they message you, it will appear here.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <ConversationListClient initialConversations={initialConversations} currentUserId={currentUser.id} />
      )}
    </div>
  );
}
