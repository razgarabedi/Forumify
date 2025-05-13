
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import {
    sendPrivateMessage as dbSendPrivateMessage,
    getConversationsForUser as dbGetConversationsForUser,
    getMessagesForConversation as dbGetMessagesForConversation,
    getTotalUnreadPrivateMessagesCountForUser as dbGetTotalUnreadPMCount,
    findUserByUsername,
    findUserById,
    generateConversationId, // This is a utility, can stay as is or be moved to utils.ts
    getConversationById as dbGetConversationById,
    getOrCreateConversation,
    createNotification,
} from "@/lib/db"; // Changed from placeholder-data to db
import { getCurrentUser } from "./auth";
import type { ActionResponse, ConversationListItem, PrivateMessageDisplay } from "@/lib/types";

const SendMessageSchema = z.object({
    content: z.string().min(1, { message: "Message content cannot be empty." }).max(2000, {message: "Message content cannot exceed 2000 characters."}),
    receiverId: z.string().min(1, { message: "Receiver ID is required." }), 
    conversationId: z.string().min(1, {message: "Conversation ID is required."}),
});

export async function sendPrivateMessageAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "Unauthorized: You must be logged in." };
    }

    const validatedFields = SendMessageSchema.safeParse({
        content: formData.get("content"),
        receiverId: formData.get("receiverId"), 
        conversationId: formData.get("conversationId"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to send message. Please check your input.",
            success: false,
        };
    }

    const { content, receiverId: formReceiverId, conversationId: formConversationId } = validatedFields.data;
    
    const receiverUser = await findUserById(formReceiverId);
    if(!receiverUser) {
        return { success: false, message: "Receiver not found." };
    }
    if(receiverUser.id === currentUser.id) {
        return { success: false, message: "You cannot send a message to yourself." };
    }

    const existingConversation = await dbGetConversationById(formConversationId);
    if (!existingConversation) {
        console.warn(`[sendPrivateMessageAction] Conversation with ID ${formConversationId} not found. dbSendPrivateMessage will attempt to create it.`);
    } else {
        if (!existingConversation.participantIds.includes(currentUser.id) || !existingConversation.participantIds.includes(formReceiverId)) {
            console.error(`Security check failed: User ${currentUser.id} or receiver ${formReceiverId} not in conversation ${formConversationId}. Participants: ${existingConversation.participantIds.join(', ')}`);
            return { success: false, message: "Security check failed: You are not part of this conversation or receiver is incorrect." };
        }
    }
    
    try {
        const newMessage = await dbSendPrivateMessage(currentUser.id, formReceiverId, content, existingConversation?.subject);

        await createNotification({
            type: 'private_message',
            recipientUserId: receiverUser.id,
            senderId: currentUser.id,
            senderUsername: currentUser.username,
            conversationId: newMessage.conversationId,
            message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        });

        revalidatePath(`/messages/${newMessage.conversationId}`);
        revalidatePath('/messages'); 
        revalidatePath('/', 'layout');
        revalidatePath('/notifications');

        return { success: true, message: "Message sent successfully.", privateMessage: newMessage };
    } catch (error: any) {
        console.error("Send Private Message Error:", error);
        return { success: false, message: error.message || "Failed to send message." };
    }
}


export async function fetchConversationsAction(): Promise<ConversationListItem[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return [];
    }

    const conversationsData = await dbGetConversationsForUser(currentUser.id);
    const conversationListItems: ConversationListItem[] = [];

    for (const conv of conversationsData) {
        const otherParticipantId = conv.participantIds.find(id => id !== currentUser.id);
        if (!otherParticipantId) continue;

        const otherParticipant = await findUserById(otherParticipantId);
        if (!otherParticipant) continue;
        
        const messagesInConv = await dbGetMessagesForConversation(conv.id, currentUser.id, false); 
        const lastMessage = messagesInConv.length > 0 ? messagesInConv[messagesInConv.length-1] : null;
        const unreadCount = messagesInConv.filter(m => m.senderId !== currentUser.id && !m.readBy.includes(currentUser.id)).length;

        conversationListItems.push({
            id: conv.id,
            otherParticipant,
            subject: conv.subject, 
            lastMessageSnippet: conv.lastMessageSnippet || (lastMessage ? lastMessage.content.substring(0, 30) + (lastMessage.content.length > 30 ? '...' : '') : "No messages yet"),
            lastMessageAt: conv.lastMessageAt,
            unreadCount: unreadCount, 
            isLastMessageFromCurrentUser: lastMessage?.senderId === currentUser.id,
        });
    }
    return conversationListItems.sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export async function fetchMessagesAction(conversationId: string): Promise<PrivateMessageDisplay[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return [];
    }

    const conversation = await dbGetConversationById(conversationId);
    if (!conversation || !conversation.participantIds.includes(currentUser.id)) {
        console.warn(`User ${currentUser.id} attempted to access conversation ${conversationId} they are not part of.`);
        return []; 
    }

    const messagesData = await dbGetMessagesForConversation(conversationId, currentUser.id, true);
    
    const messageDisplays = await Promise.all(messagesData.map(async msg => {
        const sender = await findUserById(msg.senderId);
        return {
            ...msg,
            sender: sender || { id: 'unknown', username: 'Unknown User', email: '', createdAt: new Date() }, 
            isOwnMessage: msg.senderId === currentUser.id,
        };
    }));

    return messageDisplays;
}

export async function triggerMessageRevalidationAction(conversationId: string): Promise<void> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        console.warn("triggerMessageRevalidationAction: No current user found.");
        return;
    }

    const conversation = await dbGetConversationById(conversationId);
    if (!conversation || !conversation.participantIds.includes(currentUser.id)) {
        console.warn(`triggerMessageRevalidationAction: User ${currentUser.id} not part of conversation ${conversationId}.`);
        return;
    }

    revalidatePath('/messages'); 
    revalidatePath(`/messages/${conversationId}`); 
    revalidatePath('/', 'layout'); 
    console.log(`[triggerMessageRevalidationAction] Triggered revalidation for conversation ${conversationId} and related paths.`);
}


export async function getUnreadPrivateMessageCountAction(): Promise<number> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return 0;
    }
    return dbGetTotalUnreadPMCount(currentUser.id);
}


const StartConversationSchema = z.object({
  username: z.string().min(1, "Username cannot be empty.").max(50, "Username is too long."),
  subject: z.string().min(3, "Subject must be at least 3 characters.").max(100, "Subject cannot exceed 100 characters.").optional(),
});

export async function startConversationWithUsernameAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "You must be logged in to start a conversation." };
  }

  const validatedFields = StartConversationSchema.safeParse({
    username: formData.get("username"),
    subject: formData.get("subject") || undefined, 
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid input.",
      success: false,
    };
  }

  const { username, subject } = validatedFields.data;

  const receiver = await findUserByUsername(username);
  if (!receiver) {
    return { success: false, message: `User "${username}" not found.`, errors: { username: [`User "${username}" not found.`] } };
  }

  if (receiver.id === currentUser.id) {
    return { success: false, message: "You cannot start a conversation with yourself.", errors: { username: ["You cannot start a conversation with yourself."] } };
  }
  
  const conversation = await getOrCreateConversation(currentUser.id, receiver.id, subject);
  
  revalidatePath('/messages'); 
  redirect(`/messages/${conversation.id}`);
  // Note: redirect will throw an error.
  // return { success: true, message: "Conversation started.", conversationId: conversation.id };
}
