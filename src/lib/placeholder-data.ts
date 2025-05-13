
import type { User, Category, Topic, Post, Notification, Conversation, PrivateMessage, Reaction, ReactionType, CategoryLastPostInfo } from './types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs in placeholder

// Placeholder Users - Reset to empty, will be populated if DB init fails or not used
let users: User[] = [];

// Placeholder Categories
let categories: Omit<Category, 'topicCount' | 'postCount' | 'lastPost'>[] = [];

// Placeholder Topics
let topics: Topic[] = [];

// Placeholder Posts
let posts: Post[] = [];

// Placeholder Notifications
let notifications: Notification[] = [];

// Placeholder Private Messages & Conversations
let conversations: Conversation[] = [];
let privateMessages: PrivateMessage[] = [];


// --- Points Calculation ---
export const calculateUserPoints = async (postAuthorId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5)); 
    let totalPoints = 0;
    const authorPosts = posts.filter(p => p.authorId === postAuthorId);

    for (const post of authorPosts) {
        if (post.reactions && post.reactions.length > 0) {
            for (const reaction of post.reactions) {
                if (reaction.userId !== postAuthorId) {
                    switch (reaction.type) {
                        case 'like':
                        case 'love':
                            totalPoints += 2;
                            break;
                        case 'haha':
                        case 'wow':
                            totalPoints += 1;
                            break;
                    }
                }
            }
        }
    }
    // In placeholder, points are calculated on the fly. In DB, they might be stored.
    const userIndex = users.findIndex(u => u.id === postAuthorId);
    if (userIndex !== -1) {
        users[userIndex].points = totalPoints;
    }
    return totalPoints;
};


// --- Simulation Functions ---

export const getAllUsers = async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return Promise.all(users.map(async user => ({
        ...user,
        postCount: posts.filter(p => p.authorId === user.id).length,
        points: user.points ?? await calculateUserPoints(user.id), // Use stored or calculate
    })));
};


export const findUserByEmail = async (email: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 10));
  const user = users.find(u => u.email === email);
  if (!user) return null;
  const postCount = await getUserPostCount(user.id);
  const points = user.points ?? await calculateUserPoints(user.id);
  return { ...user, postCount, points, lastActive: user.lastActive || user.createdAt };
};

export const findUserById = async (id: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const postCount = await getUserPostCount(user.id);
    const points = user.points ?? await calculateUserPoints(user.id);
    return { ...user, postCount, points, lastActive: user.lastActive || user.createdAt };
}

export const findUserByUsername = async (username: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return null;
    }
    const postCount = await getUserPostCount(user.id);
    const points = user.points ?? await calculateUserPoints(user.id);
    return { ...user, postCount, points, lastActive: user.lastActive || user.createdAt };
};


interface CreateUserParams {
    username: string;
    email: string;
    password?: string;
    isAdmin?: boolean;
    aboutMe?: string;
    location?: string;
    websiteUrl?: string;
    socialMediaUrl?: string;
    signature?: string;
    lastActive: Date;
    avatarUrl?: string;
}

export const createUser = async (userData: CreateUserParams): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const now = new Date();
  const newUser: User = {
    id: uuidv4(),
    username: userData.username,
    email: userData.email,
    password: userData.password, // Storing plain for placeholder
    isAdmin: userData.isAdmin ?? false,
    createdAt: now,
    lastActive: userData.lastActive || now,
    aboutMe: userData.aboutMe || `Hello, I'm ${userData.username}!`,
    location: userData.location,
    websiteUrl: userData.websiteUrl,
    socialMediaUrl: userData.socialMediaUrl,
    signature: userData.signature || `Regards, ${userData.username}`,
    avatarUrl: userData.avatarUrl || `https://avatar.vercel.sh/${userData.username}.png?size=128`,
    postCount: 0,
    points: 0,
  };
  users.push(newUser);
  return { ...newUser };
};

export const updateUserProfile = async (userId: string, profileData: Partial<Omit<User, 'id' | 'email' | 'password' | 'isAdmin' | 'createdAt' | 'postCount' | 'points'>>): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    users[userIndex] = {
        ...users[userIndex],
        ...profileData,
        lastActive: new Date()
    };
    const postCount = await getUserPostCount(userId);
    const points = users[userIndex].points ?? await calculateUserPoints(userId);
    return { ...users[userIndex], postCount, points };
};


export const updateUserLastActive = async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].lastActive = new Date();
    }
};

export const updateUserPassword = async (userId: string, currentPasswordPlain: string, newPasswordPlain: string): Promise<{success: boolean, message?: string}> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: "User not found." };
    }
    if (users[userIndex].password !== currentPasswordPlain) {
        return { success: false, message: "Incorrect current password." };
    }
    users[userIndex].password = newPasswordPlain;
    users[userIndex].lastActive = new Date();
    return { success: true };
};


export const setUserAdminStatus = async (userId: string, isAdmin: boolean): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    
    users[userIndex].isAdmin = isAdmin;
    users[userIndex].lastActive = new Date();
    const postCount = await getUserPostCount(userId);
    const points = users[userIndex].points ?? await calculateUserPoints(userId);
    return { ...users[userIndex], postCount, points };
}

export const deleteUser = async (userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);

    if (users.length < initialLength) {
        conversations = conversations.filter(c => !c.participantIds.includes(userId));
        privateMessages = privateMessages.filter(pm => pm.senderId !== userId && !conversations.find(c => c.id === pm.conversationId && c.participantIds.includes(userId)));
        // Nullify author for posts, or delete them, depending on desired behavior
        posts.forEach(p => { if (p.authorId === userId) p.authorId = 'deleted_user'; }); 
        return true;
    }
    return false;
}


export const getCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 20));
  return Promise.all(
    categories.map(async (catData) => {
      const categoryTopics = topics.filter(t => t.categoryId === catData.id);
      const topicCount = categoryTopics.length;
      let postCount = 0;
      let lastPost: CategoryLastPostInfo | null = null;
      
      if (categoryTopics.length > 0) {
        const categoryPosts = posts.filter(p => categoryTopics.some(ct => ct.id === p.topicId));
        postCount = categoryPosts.length;
        if (categoryPosts.length > 0) {
          const sortedPosts = [...categoryPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const latestPostData = sortedPosts[0];
          const latestPostAuthor = await findUserById(latestPostData.authorId);
          const latestPostTopic = topics.find(t => t.id === latestPostData.topicId);
          if (latestPostData && latestPostAuthor && latestPostTopic) {
            lastPost = {
              id: latestPostData.id,
              topicId: latestPostTopic.id,
              topicTitle: latestPostTopic.title,
              authorId: latestPostAuthor.id,
              authorUsername: latestPostAuthor.username,
              authorAvatarUrl: latestPostAuthor.avatarUrl,
              createdAt: new Date(latestPostData.createdAt),
            };
          }
        }
      }
      return { ...catData, topicCount, postCount, lastPost };
    })
  );
};


export const getCategoryById = async (id: string): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const categoryData = categories.find(c => c.id === id);
    if (!categoryData) return null;

    const categoryTopics = topics.filter(t => t.categoryId === categoryData.id);
    const topicCount = categoryTopics.length;
    let postCount = 0;
    let lastPost: CategoryLastPostInfo | null = null;
    
    if (categoryTopics.length > 0) {
      const categoryPosts = posts.filter(p => categoryTopics.some(ct => ct.id === p.topicId));
      postCount = categoryPosts.length;
      if (categoryPosts.length > 0) {
        const sortedPosts = [...categoryPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latestPostData = sortedPosts[0];
        const latestPostAuthor = await findUserById(latestPostData.authorId);
        const latestPostTopic = topics.find(t => t.id === latestPostData.topicId);
        if (latestPostData && latestPostAuthor && latestPostTopic) {
          lastPost = {
            id: latestPostData.id,
            topicId: latestPostTopic.id,
            topicTitle: latestPostTopic.title,
            authorId: latestPostAuthor.id,
            authorUsername: latestPostAuthor.username,
            authorAvatarUrl: latestPostAuthor.avatarUrl,
            createdAt: new Date(latestPostData.createdAt),
          };
        }
      }
    }
    return { ...categoryData, topicCount, postCount, lastPost };
}

export const createCategory = async (categoryData: Pick<Category, 'name' | 'description'>): Promise<Category> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const newCategoryData: Omit<Category, 'topicCount' | 'postCount' | 'lastPost'> = {
        id: uuidv4(),
        name: categoryData.name,
        description: categoryData.description,
        createdAt: new Date(),
    };
    categories.push(newCategoryData);
    return { ...newCategoryData, topicCount: 0, postCount: 0, lastPost: null };
}

export const updateCategory = async (categoryId: string, data: { name: string; description?: string }): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const catIndex = categories.findIndex(c => c.id === categoryId);
    if (catIndex === -1) return null;
    categories[catIndex] = { ...categories[catIndex], ...data };
    return getCategoryById(categoryId);
}

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const initialLength = categories.length;
    const topicsToDelete = topics.filter(t => t.categoryId === categoryId).map(t => t.id);
    categories = categories.filter(c => c.id !== categoryId);
    topics = topics.filter(t => t.categoryId !== categoryId);
    posts = posts.filter(p => !topicsToDelete.includes(p.topicId));
    return categories.length < initialLength;
}


export const getTopicsByCategory = async (categoryId: string): Promise<Topic[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const categoryTopics = topics
    .filter(t => t.categoryId === categoryId)
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

  return Promise.all(categoryTopics.map(async topic => {
    const author = await findUserById(topic.authorId);
    return { ...topic, author, postCount: posts.filter(p => p.topicId === topic.id).length };
  }));
};

export const getTopicById = async (id: string): Promise<Topic | null> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    const topic = topics.find(t => t.id === id);
    if (!topic) return null;
    const author = await findUserById(topic.authorId);
    const category = await getCategoryById(topic.categoryId);
    return { ...topic, author, category, postCount: posts.filter(p => p.topicId === id).length };
}

export const getTopicByIdSimple = async (id: string): Promise<Topic | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const topic = topics.find(t => t.id === id);
    return topic ? { ...topic } : null;
}


interface CreateTopicParams extends Omit<Topic, 'id' | 'createdAt' | 'lastActivity' | 'postCount' | 'author' | 'category'> {
    firstPostContent: string;
    firstPostImageUrl?: string;
}

export const createTopic = async (topicData: CreateTopicParams): Promise<Topic> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const now = new Date();
    const newTopic: Topic = {
        id: uuidv4(),
        title: topicData.title,
        categoryId: topicData.categoryId,
        authorId: topicData.authorId,
        createdAt: now,
        lastActivity: now,
        postCount: 0, 
    };
    topics.push(newTopic);
    await updateUserLastActive(topicData.authorId);

    await createPost({ 
        content: topicData.firstPostContent,
        topicId: newTopic.id,
        authorId: topicData.authorId,
        imageUrl: topicData.firstPostImageUrl,
    });
    
    const finalTopic = await getTopicById(newTopic.id);
    return finalTopic || { ...newTopic, postCount: 1 }; 
}


export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
  await new Promise(resolve => setTimeout(resolve, 20));
  const topicPosts = posts.filter(p => p.topicId === topicId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return Promise.all(topicPosts.map(async post => {
    const author = await findUserById(post.authorId);
    const topic = await getTopicByIdSimple(post.topicId); 
    return { ...post, author, topic: topic ?? undefined, reactions: post.reactions || [] };
  }));
};

export const getUserPostCount = async (userId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return posts.filter(p => p.authorId === userId).length;
};

interface CreatePostParams extends Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'topic' | 'reactions'> {
    imageUrl?: string;
}

export const createPost = async (postData: CreatePostParams): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const now = new Date();
    const newPost: Post = {
        id: uuidv4(),
        content: postData.content,
        topicId: postData.topicId,
        authorId: postData.authorId,
        imageUrl: postData.imageUrl,
        createdAt: now,
        reactions: [],
    };
    posts.push(newPost);
    await updateUserLastActive(postData.authorId);

    const topicIndex = topics.findIndex(t => t.id === postData.topicId);
    if (topicIndex !== -1) {
        topics[topicIndex].lastActivity = now;
        topics[topicIndex].postCount = (topics[topicIndex].postCount || 0) + 1;
    }

    const author = await findUserById(newPost.authorId);
    const topic = await getTopicByIdSimple(newPost.topicId);
    return { ...newPost, author: author ?? undefined, topic: topic ?? undefined };
};

export const updatePost = async (postId: string, content: string, userId: string, imageUrl?: string | null): Promise<Post | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return null;

    const post = posts[postIndex];
    const user = await findUserById(userId);
    const canModify = user?.isAdmin || post.authorId === userId;

    if (!canModify) return null;
    
    await updateUserLastActive(userId);
    post.content = content;
    if (imageUrl === null) delete post.imageUrl;
    else if (imageUrl !== undefined) post.imageUrl = imageUrl;
    post.updatedAt = new Date();

    const author = await findUserById(post.authorId);
    const topic = await getTopicByIdSimple(post.topicId);
    return { ...post, author: author ?? undefined, topic: topic ?? undefined, reactions: post.reactions || [] };
};

export const deletePost = async (postId: string, userId: string, isAdmin: boolean): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const postIndex = posts.findIndex(p => p.id === postId);
     if (postIndex === -1) return false;

    const postToDelete = posts[postIndex];
    const canDelete = isAdmin || postToDelete.authorId === userId;
     if (!canDelete) return false;
    
    await updateUserLastActive(userId);
    const deletedPost = posts.splice(postIndex, 1)[0];
    const topicIndex = topics.findIndex(t => t.id === deletedPost.topicId);
    if (topicIndex !== -1) {
        topics[topicIndex].postCount = Math.max(0, (topics[topicIndex].postCount || 1) - 1);
    }
    return true;
};


export const togglePostReaction = async (postId: string, userId: string, username: string, reactionType: ReactionType): Promise<Post | null> => {
  await new Promise(resolve => setTimeout(resolve, 30));
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1) return null;

  const post = posts[postIndex];
  if (!post.reactions) post.reactions = [];

  const existingReactionIndex = post.reactions.findIndex(r => r.userId === userId);
  if (existingReactionIndex !== -1) {
    if (post.reactions[existingReactionIndex].type === reactionType) {
      post.reactions.splice(existingReactionIndex, 1);
    } else {
      post.reactions[existingReactionIndex].type = reactionType;
    }
  } else {
    post.reactions.push({ userId, username, type: reactionType });
  }
  
  await updateUserLastActive(userId);
  await calculateUserPoints(post.authorId); // Recalculate points for author

  const author = await findUserById(post.authorId); 
  const topic = await getTopicByIdSimple(post.topicId);
  return { ...post, author: author ?? undefined, topic: topic ?? undefined, reactions: [...post.reactions] };
};


export const getTotalUserCount = async (): Promise<number> => (users.length);
export const getTotalCategoryCount = async (): Promise<number> => (categories.length);
export const getTotalTopicCount = async (): Promise<number> => (topics.length);
export const getTotalPostCount = async (): Promise<number> => (posts.length);


export const createNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const newNotification: Notification = {
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
        isRead: false,
    };
    notifications.push(newNotification);
    return { ...newNotification };
};

export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return notifications
        .filter(n => n.recipientUserId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return notifications.filter(n => n.recipientUserId === userId && !n.isRead).length;
};

export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.recipientUserId === userId);
    if (notificationIndex !== -1) {
        notifications[notificationIndex].isRead = true;
        return true;
    }
    return false;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    let markedAny = false;
    notifications.forEach(n => {
        if (n.recipientUserId === userId && !n.isRead) {
            n.isRead = true;
            markedAny = true;
        }
    });
    return markedAny;
};


const sanitizeSubjectForId = (subject?: string): string => {
    if (!subject || subject.trim() === "") return "";
    return subject.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').substring(0, 50);
};

export const generateConversationId = (userId1: string, userId2: string, subject?: string): string => {
    const ids = [userId1, userId2].sort();
    const baseId = `conv-${ids[0]}__${ids[1]}`;
    const sanitizedSubject = sanitizeSubjectForId(subject);
    return sanitizedSubject ? `${baseId}--s-${sanitizedSubject}` : baseId;
};

export const getOrCreateConversation = async (userId1: string, userId2: string, subject?: string): Promise<Conversation> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const conversationId = generateConversationId(userId1, userId2, subject);
    let conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) {
        const now = new Date();
        conversation = {
            id: conversationId,
            participantIds: [userId1, userId2].sort(),
            subject: subject,
            createdAt: now,
            lastMessageAt: now, 
        };
        conversations.push(conversation);
    }
    return { ...conversation };
};

export const sendPrivateMessage = async (senderId: string, receiverId: string, content: string, subject?: string): Promise<PrivateMessage> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const conversation = await getOrCreateConversation(senderId, receiverId, subject); 
    const now = new Date();
    const newMessage: PrivateMessage = {
        id: uuidv4(),
        conversationId: conversation.id,
        senderId,
        content,
        createdAt: now,
        readBy: [senderId], 
    };
    privateMessages.push(newMessage);
    const convIndex = conversations.findIndex(c => c.id === conversation.id);
    if (convIndex !== -1) {
        conversations[convIndex].lastMessageAt = now;
        conversations[convIndex].lastMessageSnippet = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        conversations[convIndex].lastMessageSenderId = senderId;
    }
    await updateUserLastActive(senderId);
    return { ...newMessage };
};

export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    return conversations
        .filter(c => c.participantIds.includes(userId))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
};

export const getMessagesForConversation = async (conversationId: string, currentUserId: string, markAsRead: boolean = true): Promise<PrivateMessage[]> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    const messagesInConv = privateMessages
        .filter(pm => pm.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (markAsRead) {
        messagesInConv.forEach(msg => {
            if (msg.senderId !== currentUserId && !msg.readBy.includes(currentUserId)) {
                msg.readBy.push(currentUserId);
            }
        });
    }
    return messagesInConv;
};

export const getUnreadPrivateMessagesCountForConversation = async (conversationId: string, userId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return privateMessages.filter(pm => pm.conversationId === conversationId && pm.senderId !== userId && !pm.readBy.includes(userId)).length;
};

export const getTotalUnreadPrivateMessagesCountForUser = async (userId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const userConversations = await getConversationsForUser(userId);
    let totalUnread = 0;
    for (const conv of userConversations) {
        totalUnread += await getUnreadPrivateMessagesCountForConversation(conv.id, userId);
    }
    return totalUnread;
};

export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const conversation = conversations.find(c => c.id === conversationId);
    return conversation ? { ...conversation } : null;
};

// Fallback data initialization if DATABASE_URL is not set and db.ts fails to initialize fully
// This section is important if db.ts initialization fails or DATABASE_URL is not provided
// This ensures the app can still run with placeholder data.
if (!process.env.DATABASE_URL && users.length === 0 && categories.length === 0) {
    console.warn("DATABASE_URL not set OR db.ts initialization failed. Initializing placeholder data with defaults for fallback.");
    
    const adminUserPlaceholder: User = {
        id: 'admin-user-placeholder-fallback',
        username: "admin_fallback",
        email: "admin_fallback@forumlite.com",
        password: "password123",
        isAdmin: true,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        lastActive: new Date(),
        aboutMe: "Default administrator account for placeholder data (fallback).",
        points: 0,
        postCount: 0,
        avatarUrl: 'https://avatar.vercel.sh/admin_fallback.png?size=128',
    };
    users = [adminUserPlaceholder];

    const generalCatData: Omit<Category, 'topicCount' | 'postCount' | 'lastPost'> = { id: 'cat1-placeholder-fallback', name: 'General Discussion (Fallback)', description: 'Talk about anything (fallback).', createdAt: new Date('2023-01-10T09:00:00Z') };
    categories = [generalCatData];
    
    const welcomeTopicPlaceholder: Topic = {
        id: 'topic1-placeholder-fallback',
        title: "Welcome to ForumLite (Fallback)",
        categoryId: generalCatData.id,
        authorId: adminUserPlaceholder.id,
        createdAt: new Date('2023-01-10T10:00:00Z'),
        lastActivity: new Date('2023-01-10T10:05:00Z'),
        postCount: 1,
    };
    topics = [welcomeTopicPlaceholder];
    posts = [{
        id: 'post1-placeholder-fallback',
        content: "This is the first post in the fallback placeholder topic.",
        topicId: welcomeTopicPlaceholder.id,
        authorId: adminUserPlaceholder.id,
        createdAt: new Date('2023-01-10T10:00:00Z'),
        reactions: [],
    }];
    console.log("Placeholder data initialized with defaults as a fallback measure.");
}
