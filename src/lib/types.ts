
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
  language?: 'en' | 'de'; // User's preferred language
};

export type CategoryLastPostInfo = {
  id: string; // post id
  topicId: string;
  topicTitle: string;
  topicSlug?: string; // Added topic slug
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  createdAt: Date;
};

export type Category = {
  id: string;
  name: string;
  slug: string; // Added slug field
  description?: string;
  createdAt: Date;
  topicCount: number;
  postCount: number;
  lastPost?: CategoryLastPostInfo | null;
};

export type Topic = {
  id: string;
  title: string;
  slug: string; // Added slug field
  categoryId: string;
  authorId: string;
  createdAt: Date;
  lastActivity: Date;
  postCount?: number; // Optional: denormalized count
  author?: User; // Optional: include author details
  category?: Pick<Category, 'id' | 'name' | 'description' | 'createdAt' | 'slug'>; // Optional: include category details
  firstPostContentSnippet: string; // For meta description
  firstPostImageUrl?: string;     // For meta image
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
  topic?: Pick<Topic, 'id' | 'title' | 'slug' | 'categoryId' | 'authorId' | 'createdAt' | 'lastActivity'>;   // Optional: include topic details
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
  topicSlug?: string; // Slug of the topic for links
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

export type SiteSettingKey = 
  | 'events_widget_enabled' 
  | 'events_widget_position' 
  | 'events_widget_detail_level'
  | 'events_widget_item_count'
  | 'events_widget_title'
  | 'multilingual_enabled'
  | 'default_language'
  | 'seo_site_title'
  | 'seo_site_description'
  | 'seo_site_keywords'
  | 'seo_og_image'
  | 'seo_twitter_handle'
  | 'seo_google_analytics_id'
  | 'seo_google_site_verification'
  | 'seo_bing_site_verification'
  | 'seo_robots_txt'
  | 'seo_sitemap_enabled'
  | 'seo_friendly_urls_enabled';

export type SiteSettings = {
  events_widget_enabled: boolean;
  events_widget_position: EventWidgetPosition;
  events_widget_detail_level: EventWidgetDetailLevel;
  events_widget_item_count: number;
  events_widget_title?: string; 
  multilingual_enabled: boolean;
  default_language: 'en' | 'de';
  // SEO Settings
  seo_site_title?: string;
  seo_site_description?: string;
  seo_site_keywords?: string;
  seo_og_image?: string;
  seo_twitter_handle?: string;
  seo_google_analytics_id?: string;
  seo_google_site_verification?: string;
  seo_bing_site_verification?: string;
  seo_robots_txt?: string;
  seo_sitemap_enabled: boolean;
  seo_friendly_urls_enabled: boolean;
};

// Helper for Zod schema if needed, or direct usage in Zod
export const siteSettingKeys: SiteSettingKey[] = [
  'events_widget_enabled',
  'events_widget_position',
  'events_widget_detail_level',
  'events_widget_item_count',
  'events_widget_title',
  'multilingual_enabled',
  'default_language',
  'seo_site_title',
  'seo_site_description',
  'seo_site_keywords',
  'seo_og_image',
  'seo_twitter_handle',
  'seo_google_analytics_id',
  'seo_google_site_verification',
  'seo_bing_site_verification',
  'seo_robots_txt',
  'seo_sitemap_enabled',
  'seo_friendly_urls_enabled'
];

// SEO Types
export type SEOData = {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
};

export type StructuredData = {
  '@context': string;
  '@type': string;
  [key: string]: any;
};

export type PageSEOData = SEOData & {
  structuredData?: StructuredData[];
};
