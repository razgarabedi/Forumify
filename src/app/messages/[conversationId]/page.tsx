
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

interface ConversationPageProps {
  params: { conversationId: string };
}

export async function generateMetadata({ params }: ConversationPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { title: 'Private Message - ForumLite' };

  // Attempt to parse conversationId to find other participant for metadata title
  let otherParticipantUsername: string | null = null;
  if (params.conversationId.startsWith('conv-')) {
    const ids = params.conversationId.substring(5).split('-');
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

  // Fallback if conversation or other participant can't be determined early for metadata
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

  let participantIdsFromConvId: string[] = [];
  if (conversationId.startsWith('conv-')) {
    participantIdsFromConvId = conversationId.substring(5).split('-');
  }

  // Validate conversationId format and if current user is part of it (if format is parsable)
  if (conversationId.startsWith('conv-') && (participantIdsFromConvId.length !== 2 || !participantIdsFromConvId.includes(currentUser.id))) {
    console.warn(`User ${currentUser.id} attempting to access conversation ${conversationId} with invalid format or not being a participant.`);
    notFound(); // Invalid format or user not part of this conv ID
  }


  const conversation = await getConversationById(conversationId); // Fetch conversation details

  let otherParticipant: Awaited<ReturnType<typeof findUserById>>;

  if (!conversation) {
    // This can happen if the conversationId is valid format but no messages exist yet (new chat),
    // or if conversationId is not 'conv-...' type (which getConversationById would return null for).
    
    // If conversationId wasn't in 'conv-id-id' format, or if it was but user wasn't part of it,
    // participantIdsFromConvId might be empty or not include current user.
    if (!conversationId.startsWith('conv-') || participantIdsFromConvId.length !== 2) {
        console.error("Cannot determine participants for new conversation from invalid ID format:", conversationId);
        notFound();
    }

    const otherParticipantIdStr = participantIdsFromConvId.find(id => id !== currentUser.id);
    if (!otherParticipantIdStr) {
        console.error("Could not determine other participant for new conversation:", conversationId, "Participant IDs derived:", participantIdsFromConvId, "Current User ID:", currentUser.id);
        notFound();
    }
    
    otherParticipant = await findUserById(otherParticipantIdStr);
    if (!otherParticipant) {
        console.error("Other participant not found for new conversation:", otherParticipantIdStr);
        notFound();
    }
    
    // Render UI for starting a new conversation
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
            {/* Ensure messages array is empty as it's a new chat */}
            <MessageListClient initialMessages={[]} currentUserId={currentUser.id} />
            <MessageForm conversationId={conversationId} receiverId={otherParticipant.id} />
        </div>
    );
  }
  
  // If conversation exists
  const otherParticipantId = conversation.participantIds.find(id => id !== currentUser.id);
  if (!otherParticipantId) {
    console.error("Could not determine other participant in existing conversation:", conversationId);
    notFound(); // Should not happen if conversation exists and user is part of it
  }
  
  otherParticipant = await findUserById(otherParticipantId);
   if (!otherParticipant) {
        console.error("Other participant not found for existing conversation:", otherParticipantId);
        notFound();
    }

  const initialMessages = await fetchMessagesAction(conversationId);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] border rounded-lg shadow-sm overflow-hidden">
      {/* Header with other participant's info */}
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

      {/* Message List */}
      <MessageListClient initialMessages={initialMessages} currentUserId={currentUser.id} />

      {/* Message Input Form */}
      <MessageForm conversationId={conversationId} receiverId={otherParticipant.id} />
    </div>
  );
}

