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
  mentionedUserId: string; // User who was mentioned
  mentionerId: string; // User who made the mention
  mentionerUsername: string; // Username of the mentioner
  postId: string; // Post where the mention occurred
  topicId: string; // Topic of the post
  topicTitle: string; // Title of the topic for display
  createdAt: Date;
  isRead: boolean;
};


// Form state for actions
export interface ActionResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  [key: string]: any; // Allow other properties like 'user' or 'topicId'
}
