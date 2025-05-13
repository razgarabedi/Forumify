
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
    content: z.string().min(1, { message: "Message content cannot be empty." }).max(2000),
    receiverId: z.string().min(1, { message: "Receiver ID is required." }), // For sending to a specific user
    conversationId: z.string().optional(), // For replying within an existing conversation
});

export async function sendPrivateMessageAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "Unauthorized: You must be logged in." };
    }

    const validatedFields = SendMessageSchema.safeParse({
        content: formData.get("content"),
        receiverId: formData.get("receiverId"), // This will be used if conversationId is not present
        conversationId: formData.get("conversationId"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to send message. Please check your input.",
            success: false,
        };
    }

    const { content, receiverId, conversationId: providedConvId } = validatedFields.data;
    
    let targetConversationId = providedConvId;

    if (!targetConversationId) {
        if (!receiverId) {
            return { success: false, message: "Receiver not specified." };
        }
        targetConversationId = generateConversationId(currentUser.id, receiverId);
    } else {
        // Verify current user is part of this conversation
        const conversation = await dbGetConversationById(targetConversationId);
        if (!conversation || !conversation.participantIds.includes(currentUser.id)) {
             return { success: false, message: "Invalid conversation." };
        }
    }
    
    // If receiverId was provided (e.g. starting new chat), ensure it's valid for creating conversation.
    // The dbSendPrivateMessage internally calls getOrCreateConversation using senderId and the *other* participant's ID.
    // So, we need to ensure receiverId passed to dbSendPrivateMessage is the ID of the *other* user.
    const actualReceiverId = receiverId; //This should be the ID of the other participant.

    try {
        const newMessage = await dbSendPrivateMessage(currentUser.id, actualReceiverId, content);

        revalidatePath(`/messages/${newMessage.conversationId}`);
        revalidatePath('/messages');
        revalidatePath('/', 'layout'); // For header unread count update

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
        
        const unreadCount = await dbGetTotalUnreadPrivateMessagesCountForUser(currentUser.id); // This gets total, need per convo
        // For simplicity, let's fetch last message for snippet here.
        // In a real app, this might be denormalized on the Conversation object.
        const messagesInConv = await dbGetMessagesForConversation(conv.id, currentUser.id); // This marks as read. Be careful.
                                                                                       // For list view, we don't want to mark as read yet.
                                                                                       // Let's use a simpler fetch or make getMessagesForConversation not auto-mark read.
                                                                                       // For now, we'll live with it marking read on fetch for list.
        const lastMessage = messagesInConv.length > 0 ? messagesInConv[messagesInConv.length-1] : null;


        conversationListItems.push({
            id: conv.id,
            otherParticipant,
            lastMessageSnippet: conv.lastMessageSnippet || lastMessage?.content.substring(0, 30) || "No messages yet",
            lastMessageAt: conv.lastMessageAt,
            unreadCount: messagesInConv.filter(m => m.senderId !== currentUser.id && !m.readBy.includes(currentUser.id)).length, // Recalculate unread after fetch
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
        // User is not part of this conversation
        console.warn(`User ${currentUser.id} attempted to access conversation ${conversationId} they are not part of.`);
        return []; 
    }

    const messagesData = await dbGetMessagesForConversation(conversationId, currentUser.id); // This marks messages as read
    
    // Revalidate counts after marking as read
    revalidatePath('/messages'); 
    revalidatePath('/', 'layout');


    const messageDisplays = await Promise.all(messagesData.map(async msg => {
        const sender = await findUserById(msg.senderId);
        return {
            ...msg,
            sender: sender || { id: 'unknown', username: 'Unknown User', email: '', createdAt: new Date() }, // Fallback sender
            isOwnMessage: msg.senderId === currentUser.id,
        };
    }));

    return messageDisplays;
}


export async function getUnreadPrivateMessageCountAction(): Promise<number> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return 0;
    }
    return dbGetTotalUnreadPMCount(currentUser.id);
}

// Action to create a conversation and redirect (e.g., from profile "Send Message" button)
export async function startConversationAndRedirectAction(receiverUsername: string): Promise<ActionResponse> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "You must be logged in to start a conversation." };
    }

    const receiver = await findUserByUsername(receiverUsername);
    if (!receiver) {
        return { success: false, message: `User "${receiverUsername}" not found.` };
    }

    if (receiver.id === currentUser.id) {
        return { success: false, message: "You cannot start a conversation with yourself." };
    }

    const conversationId = generateConversationId(currentUser.id, receiver.id);
    
    // The conversation will be created on first message by getOrCreateConversation
    // or when navigating to the page if it shows "start conversation" UI.
    // For now, just redirect. The page component will handle fetching/creating.
    redirect(`/messages/${conversationId}`);
    // Unreachable due to redirect, but good for type consistency if redirect was conditional
    // return { success: true, message: "Redirecting to conversation...", conversationId }; 
}
