
import { fetchMessagesAction, sendPrivateMessageAction } from '@/lib/actions/privateMessages';
import { getCurrentUser } from '@/lib/actions/auth';
import { MessageListClient } from './_components/MessageListClient'; // Corrected import path
import { MessageForm } from '../_components/MessageForm'; // Corrected import path
import { notFound, redirect } from 'next/navigation';
import { findUserById, getConversationById as dbGetConversationById, generateConversationId as dbGenerateConversationId } from '@/lib/placeholder-data'; // Aliased getConversationById
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { User } from '@/lib/types';

interface ConversationPageProps {
  params: { conversationId: string };
}

export async function generateMetadata({ params }: ConversationPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { title: 'Private Message - ForumLite' };

  const conversation = await dbGetConversationById(params.conversationId);

  if (conversation) {
    const otherParticipantId = conversation.participantIds.find(id => id !== currentUser.id);
    if (otherParticipantId) {
      const otherParticipant = await findUserById(otherParticipantId);
      if (otherParticipant) {
        let title = `Chat with ${otherParticipant.username}`;
        if (conversation.subject) {
          title = `${conversation.subject} - Chat with ${otherParticipant.username}`;
        }
        return { title: `${title} - ForumLite` };
      }
    }
  } else if (params.conversationId.startsWith('conv-')) { // Handle case where conversation might not exist yet but IDs are in param
    const ids = params.conversationId.substring(5).split('__');
    if (ids.length === 2) {
      const otherId = ids.find(id => id !== currentUser.id);
      if (otherId) {
        const otherUser = await findUserById(otherId);
        if (otherUser) {
          return { title: `Chat with ${otherUser.username} - ForumLite` };
        }
      }
    }
  }
  return { title: 'Private Message - ForumLite' };
}


export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?redirect=/messages/${conversationId}`);
  }

  if (!conversationId.startsWith('conv-')) {
    console.error(`ConversationPage: Invalid conversationId format. Expected 'conv-id1__id2', got: ${conversationId}`);
    notFound();
  }

  const participantIdParts = conversationId.substring(5).split('__'); 
  if (participantIdParts.length !== 2 || !participantIdParts[0] || !participantIdParts[1]) {
    console.error(`ConversationPage: conversationId must contain two valid participant IDs separated by '__'. Got: ${conversationId}, Parsed parts:`, participantIdParts);
    notFound();
  }

  if (!participantIdParts.includes(currentUser.id)) {
    console.error(`ConversationPage: Current user (${currentUser.id}) is not a participant in conversationId: ${conversationId}. Participants from ID:`, participantIdParts);
    notFound();
  }

  const otherParticipantId = participantIdParts.find(id => id !== currentUser.id);
  if (!otherParticipantId) {
    console.error(`ConversationPage: Could not determine other participant ID. CurrentUser: ${currentUser.id}, Parsed IDs: ${participantIdParts.join(', ')} from ${conversationId}`);
    notFound();
  }

  const otherParticipant = await findUserById(otherParticipantId);
  if (!otherParticipant) {
    console.error(`ConversationPage: Other participant with ID ${otherParticipantId} not found (from conversationId ${conversationId}).`);
    notFound();
  }

  // Fetch conversation details, including subject
  const conversationDetails = await dbGetConversationById(conversationId);

  // If conversation exists in DB, verify current user is part of it
  if (conversationDetails && !conversationDetails.participantIds.includes(currentUser.id)) {
      console.error(`ConversationPage: Mismatch - Current user ${currentUser.id} not in stored participant list for existing conversation ${conversationId}. Stored participants:`, conversationDetails.participantIds);
      notFound();
  }
  
  const initialMessages = await fetchMessagesAction(conversationId);

  // If no conversation exists yet in DB (e.g., from profile link, first message not sent)
  // still render the page structure. The subject will be missing initially.
  // `getOrCreateConversation` (called by sendPrivateMessage) will create it then.

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center p-3 border-b bg-card">
         <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/messages"><ArrowLeft className="h-5 w-5"/></Link>
         </Button>
        <Avatar className="h-9 w-9 mr-3 border">
          <AvatarImage src={otherParticipant.avatarUrl || `https://avatar.vercel.sh/${otherParticipant.username}.png?size=36`} alt={otherParticipant.username} data-ai-hint="user avatar"/>
          <AvatarFallback>{otherParticipant.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold">{otherParticipant.username}</h2>
            {conversationDetails?.subject && (
                <p className="text-sm text-muted-foreground truncate" title={conversationDetails.subject}>
                    {conversationDetails.subject}
                </p>
            )}
        </div>
      </div>
      <MessageListClient initialMessages={initialMessages} currentUserId={currentUser.id} conversationId={conversationId} />
      <MessageForm conversationId={conversationId} receiverId={otherParticipant.id} />
    </div>
  );
}

