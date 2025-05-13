
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

  const conversation = await getConversationById(params.conversationId);
  if (!conversation) return { title: 'Conversation Not Found - ForumLite' };
  
  const otherParticipantId = conversation.participantIds.find(id => id !== currentUser.id);
  if (!otherParticipantId) return { title: 'Conversation - ForumLite' };
  
  const otherParticipant = await findUserById(otherParticipantId);
  return {
    title: otherParticipant ? `Chat with ${otherParticipant.username} - ForumLite` : 'Private Message - ForumLite',
  };
}


export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?redirect=/messages/${conversationId}`);
  }

  // Validate conversationId format and participants
  const parts = conversationId.startsWith('conv-') ? conversationId.substring(5).split('-') : [];
  if (parts.length !== 2 || (!parts.includes(currentUser.id))) {
    console.warn(`Invalid conversationId format or user ${currentUser.id} not part of ${conversationId}`);
    // Optional: redirect to /messages or show a specific error. For now, let fetchMessages handle it.
  }


  const initialMessages = await fetchMessagesAction(conversationId);
  const conversation = await getConversationById(conversationId); // Fetch conversation details

  if (!conversation) {
    // This can happen if the conversationId is valid format but no messages exist yet (new chat)
    // Or if dbGetConversationById doesn't find it.
    // We still want to allow starting a conversation.
    // Need to determine the other participant from conversationId
    const participantIds = conversationId.substring(5).split('-');
    const otherParticipantId = participantIds.find(id => id !== currentUser.id);
    if (!otherParticipantId) {
        console.error("Could not determine other participant for new conversation:", conversationId);
        notFound(); // Or redirect to /messages
    }
    const otherParticipant = await findUserById(otherParticipantId);
     if (!otherParticipant) {
        console.error("Other participant not found for new conversation:", otherParticipantId);
        notFound();
    }
    // Render UI for starting a new conversation
     return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex items-center p-3 border-b">
                 <Button variant="ghost" size="icon" asChild className="mr-2">
                    <Link href="/messages"><ArrowLeft className="h-5 w-5"/></Link>
                 </Button>
                <Avatar className="h-9 w-9 mr-3 border">
                     <AvatarImage src={otherParticipant.avatarUrl || `https://avatar.vercel.sh/${otherParticipant.username}.png?size=36`} alt={otherParticipant.username} data-ai-hint="user avatar"/>
                    <AvatarFallback>{otherParticipant.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold">{otherParticipant.username}</h2>
            </div>
            <div className="flex-1 p-4 text-center text-muted-foreground">
                <p>Start your conversation with {otherParticipant.username}.</p>
            </div>
            <MessageForm conversationId={conversationId} receiverId={otherParticipant.id} />
        </div>
    );
  }
  
  const otherParticipantId = conversation.participantIds.find(id => id !== currentUser.id);
  if (!otherParticipantId) {
    console.error("Could not determine other participant in existing conversation:", conversationId);
    notFound(); // Should not happen if conversation exists and user is part of it
  }
  const otherParticipant = await findUserById(otherParticipantId);
   if (!otherParticipant) {
        console.error("Other participant not found for existing conversation:", otherParticipantId);
        notFound();
    }


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
