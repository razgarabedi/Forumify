
import { fetchMessagesAction, sendPrivateMessageAction } from '@/lib/actions/privateMessages';
import { getCurrentUser } from '@/lib/actions/auth';
import { MessageListClient } from '../_components/MessageListClient';
import { MessageForm } from '../_components/MessageForm';
import { notFound, redirect } from 'next/navigation';
import { findUserById, getConversationById, generateConversationId } from '@/lib/placeholder-data';
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

  let otherParticipantUsername: string | null = null;
  if (params.conversationId.startsWith('conv-')) {
    const ids = params.conversationId.substring(5).split('__'); // Updated delimiter
    if (ids.length === 2) {
      const otherId = ids.find(id => id !== currentUser.id);
      if (otherId) {
        const otherUser = await findUserById(otherId);
        if (otherUser) {
          otherParticipantUsername = otherUser.username;
        }
      }
    }
  }

  if (otherParticipantUsername) {
    return { title: `Chat with ${otherParticipantUsername} - ForumLite` };
  }

  const conversation = await getConversationById(params.conversationId);
  if (conversation) {
    const otherParticipantId = conversation.participantIds.find(id => id !== currentUser.id);
    if (otherParticipantId) {
      const otherParticipant = await findUserById(otherParticipantId);
      if (otherParticipant) {
        return { title: `Chat with ${otherParticipant.username} - ForumLite` };
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

  // Validate conversationId and extract participant IDs
  if (!conversationId.startsWith('conv-')) {
    console.error(`ConversationPage: Invalid conversationId format. Expected 'conv-id1__id2', got: ${conversationId}`);
    notFound();
  }

  const participantIdParts = conversationId.substring(5).split('__'); // Updated delimiter
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

  // At this point, otherParticipant is valid. Now fetch existing conversation details if any.
  const conversation = await getConversationById(conversationId);

  // Sanity check: if a conversation object exists in DB, ensure current user is part of its stored participant list.
  // This should typically be true if ID parsing was correct.
  if (conversation && !conversation.participantIds.includes(currentUser.id)) {
      console.error(`ConversationPage: Mismatch - Current user ${currentUser.id} not in stored participant list for existing conversation ${conversationId}. Stored participants:`, conversation.participantIds);
      notFound();
  }

  if (!conversation) {
    // This is a new chat (conversationId is synthetically generated for two users, but no messages/DB record yet).
    // `otherParticipant` is already fetched and validated.
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
                <h2 className="text-lg font-semibold">{otherParticipant.username}</h2>
            </div>
            <div className="flex-1 p-4 text-center text-muted-foreground flex items-center justify-center">
                <p>Start your conversation with {otherParticipant.username}.</p>
            </div>
            {/* Pass empty array for initialMessages as it's a new chat */}
            <MessageListClient initialMessages={[]} currentUserId={currentUser.id} />
            <MessageForm conversationId={conversationId} receiverId={otherParticipant.id} />
        </div>
    );
  }
  
  // If conversation exists in DB and user is part of it (otherParticipant already fetched).
  const initialMessages = await fetchMessagesAction(conversationId);

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
        <h2 className="text-lg font-semibold">{otherParticipant.username}</h2>
      </div>
      <MessageListClient initialMessages={initialMessages} currentUserId={currentUser.id} />
      <MessageForm conversationId={conversationId} receiverId={otherParticipant.id} />
    </div>
  );
}
