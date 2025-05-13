export type User = {
  id: string;
  username: string;
  email: string;
  password?: string; // Add optional password for placeholder data
  isAdmin?: boolean; // Flag for admin users
  createdAt: Date;
  aboutMe?: string;
  location?: string;
  websiteUrl?: string;
  socialMediaUrl?: string; // Generic, could be expanded
  signature?: string;
  lastActive?: Date;
  avatarUrl?: string; // For custom avatar uploads, or keep using Vercel Avatars
  postCount?: number; // Denormalized, can be calculated
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  topicCount?: number; // Optional: denormalized count
  postCount?: number;  // Optional: denormalized count
};

export type Topic = {
  id: string;
  title: string;
  categoryId: string;
  authorId: string;
  createdAt: Date;
  lastActivity: Date;
  postCount?: number; // Optional: denormalized count
  author?: User; // Optional: include author details
  category?: Category; // Optional: include category details
};

export type Post = {
  id: string;
  content: string;
  topicId: string;
  authorId: string;
  createdAt: Date;
  updatedAt?: Date;
  imageUrl?: string; // For uploaded images as data URIs
  author?: User; // Optional: include author details
  topic?: Topic;   // Optional: include topic details
};

export type Notification = {
  id: string;
  type: 'mention' | 'private_message'; // Type of notification
  recipientUserId: string; // User who receives the notification (was mentionedUserId)
  senderId: string; // User who triggered the notification (was mentionerId)
  senderUsername: string; // Username of the sender (was mentionerUsername)
  postId?: string; // Post where the mention occurred (optional for PM)
  topicId?: string; // Topic of the post (optional for PM)
  topicTitle?: string; // Title of the topic for display (optional for PM)
  conversationId?: string; // Conversation ID if it's a private message notification
  createdAt: Date;
  isRead: boolean;
  message?: string; // Optional: A short message for PM notifications e.g., "sent you a message."
};


// Form state for actions
export interface ActionResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  [key: string]: any; // Allow other properties like 'user' or 'topicId'
}

// --- Private Messaging Types ---
export type Conversation = {
  id: string; // Deterministic ID: conv-${sortedUserId1}-${sortedUserId2}
  participantIds: string[];
  subject?: string; // Subject for the conversation
  createdAt: Date;
  lastMessageAt: Date;
  // Optional: store last message snippet/sender for quick display
  lastMessageSnippet?: string;
  lastMessageSenderId?: string;
};

export type PrivateMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readBy: string[]; // Array of user IDs who have read this message
};

// For displaying in conversation list
export type ConversationListItem = {
  id: string;
  otherParticipant: User;
  subject?: string; // Display subject in list
  lastMessageSnippet: string;
  lastMessageAt: Date;
  unreadCount: number; // Number of unread messages for the current user in this conversation
  isLastMessageFromCurrentUser: boolean;
};

// For displaying individual messages
export type PrivateMessageDisplay = PrivateMessage & {
  sender: User;
  isOwnMessage: boolean;
};

