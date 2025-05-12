export type User = {
  id: string;
  username: string;
  email: string;
  password?: string; // Add optional password for placeholder data
  isAdmin?: boolean; // Flag for admin users
  createdAt: Date;
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

