
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
    generateConversationId,
    getConversationById as dbGetConversationById,
} from "@/lib/placeholder-data";
import { getCurrentUser } from "./auth";
import type { ActionResponse, Conversation, PrivateMessage, User, ConversationListItem, PrivateMessageDisplay } from "@/lib/types";

const SendMessageSchema = z.object({
    content: z.string().min(1, { message: "Message content cannot be empty." }).max(2000, {message: "Message content cannot exceed 2000 characters."}),
    receiverId: z.string().min(1, { message: "Receiver ID is required." }), 
    conversationId: z.string().min(1, {message: "Conversation ID is required."}), // Made mandatory from form
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

    const { content, receiverId, conversationId: providedConvIdFromForm } = validatedFields.data;
    
    const receiverUser = await findUserById(receiverId);
    if(!receiverUser) {
        return { success: false, message: "Receiver not found." };
    }
    if(receiverUser.id === currentUser.id) {
        return { success: false, message: "You cannot send a message to yourself." };
    }

    const expectedConvId = generateConversationId(currentUser.id, receiverId);

    if (providedConvIdFromForm !== expectedConvId) {
        console.error(`Conversation ID mismatch: Form ID "${providedConvIdFromForm}" does not match expected ID "${expectedConvId}" for sender ${currentUser.id} and receiver ${receiverId}.`);
        return { success: false, message: "Conversation ID mismatch. Please refresh the page." };
    }
    
    const existingConversationInDb = await dbGetConversationById(expectedConvId);
    if (existingConversationInDb && !existingConversationInDb.participantIds.includes(currentUser.id)) {
        return { success: false, message: "Security check failed: You are not part of this conversation." };
    }
    
    try {
        const newMessage = await dbSendPrivateMessage(currentUser.id, receiverId, content);

        revalidatePath(`/messages/${newMessage.conversationId}`);
        revalidatePath('/messages'); 
        revalidatePath('/', 'layout'); 

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
            lastMessageSnippet: conv.lastMessageSnippet || (lastMessage ? lastMessage.content.substring(0, 30) + (lastMessage.content.length > 30 ? '...' : '') : "No messages yet"),
            lastMessageAt: conv.lastMessageAt,
            unreadCount: unreadCount, 
            isLastMessageFromCurrentUser: lastMessage?.senderId === currentUser.id,
        });
    }
    return conversationListItems.sort((a,b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
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

    // dbGetMessagesForConversation will mark messages as read if the third param is true
    const messagesData = await dbGetMessagesForConversation(conversationId, currentUser.id, true);
    
    // Removed revalidatePath calls from here to prevent error during render

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

// New action specifically for revalidation, to be called from a client component
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

    revalidatePath('/messages'); // Revalidates the list of conversations
    revalidatePath(`/messages/${conversationId}`); // Revalidates the current conversation page
    revalidatePath('/', 'layout'); // Revalidates the header for unread counts
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
});

export async function startConversationWithUsernameAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "You must be logged in to start a conversation." };
  }

  const validatedFields = StartConversationSchema.safeParse({
    username: formData.get("username"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid username.",
      success: false,
    };
  }

  const { username } = validatedFields.data;

  const receiver = await findUserByUsername(username);
  if (!receiver) {
    return { success: false, message: `User "${username}" not found.`, errors: { username: [`User "${username}" not found.`] } };
  }

  if (receiver.id === currentUser.id) {
    return { success: false, message: "You cannot start a conversation with yourself.", errors: { username: ["You cannot start a conversation with yourself."] } };
  }

  const conversationId = generateConversationId(currentUser.id, receiver.id);
  
  redirect(`/messages/${conversationId}`);
}
