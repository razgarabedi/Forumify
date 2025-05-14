
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
  points?: number; // Points accumulated from post reactions
};

export type CategoryLastPostInfo = {
  id: string; // post id
  topicId: string;
  topicTitle: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  createdAt: Date;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  topicCount: number;
  postCount: number;
  lastPost?: CategoryLastPostInfo | null;
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

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export type Reaction = {
  userId: string;
  username: string;
  type: ReactionType;
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
  reactions: Reaction[]; // Array of reactions on the post
};

export type Notification = {
  id: string;
  type: 'mention' | 'private_message' | 'reaction'; // Type of notification
  recipientUserId: string; // User who receives the notification (was mentionedUserId)
  senderId: string; // User who triggered the notification (was mentionerId)
  senderUsername: string; // Username of the sender (was mentionerUsername)
  postId?: string; // Post where the mention/reaction occurred (optional for PM)
  topicId?: string; // Topic of the post (optional for PM)
  topicTitle?: string; // Title of the topic for display (optional for PM)
  conversationId?: string; // Conversation ID if it's a private message notification
  reactionType?: ReactionType; // Type of reaction if notification.type is 'reaction'
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
  id: string; // Deterministic ID: conv-${sortedUserId1}-${sortedUserId2} or with subject
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

// --- Event & Webinar Types ---
export type EventType = 'event' | 'webinar';

export type EventDetails = {
  id: string;
  title: string;
  type: EventType;
  date: Date;
  time: string; // e.g., "14:00"
  description?: string;
  link?: string; // URL for the event/webinar
  createdAt: Date;
};

// --- Site Settings Types ---
export type EventWidgetPosition = 'above_categories' | 'below_categories';
export type EventWidgetDetailLevel = 'full' | 'compact';

export type SiteSettings = {
  events_widget_enabled: boolean;
  events_widget_position: EventWidgetPosition;
  events_widget_detail_level: EventWidgetDetailLevel;
};
