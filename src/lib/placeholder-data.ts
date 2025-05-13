
import type { User, Category, Topic, Post, Notification, Conversation, PrivateMessage } from './types';

// Placeholder Users
let users: User[] = [];

// Placeholder Categories
let categories: Category[] = [
  { id: 'cat1', name: 'General Discussion', description: 'Talk about anything.', createdAt: new Date('2023-01-10T09:00:00Z'), topicCount: 0, postCount: 0 },
  { id: 'cat2', name: 'Introductions', description: 'Introduce yourself to the community.', createdAt: new Date('2023-01-10T09:05:00Z'), topicCount: 0, postCount: 0 },
  { id: 'cat3', name: 'Technical Help', description: 'Get help with technical issues.', createdAt: new Date('2023-01-11T14:00:00Z'), topicCount: 0, postCount: 0 },
];

// Placeholder Topics
let topics: Topic[] = [];

// Placeholder Posts
let posts: Post[] = [];

// Placeholder Notifications
let notifications: Notification[] = [];

// Placeholder Private Messages & Conversations
let conversations: Conversation[] = [];
let privateMessages: PrivateMessage[] = [];


// --- Simulation Functions ---

// Fetch Users
export const getAllUsers = async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return users.map(user => ({
        ...user,
        postCount: posts.filter(p => p.authorId === user.id).length
    }));
};


export const findUserByEmail = async (email: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 10));
  const user = users.find(u => u.email === email);
  if (!user) return null;
  return { ...user, postCount: await getUserPostCount(user.id), lastActive: user.lastActive || user.createdAt };
};

export const findUserById = async (id: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const user = users.find(u => u.id === id);
    if (!user) return null;
    return { ...user, postCount: await getUserPostCount(user.id), lastActive: user.lastActive || user.createdAt };
}

export const findUserByUsername = async (username: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return null;
    }
    return { ...user, postCount: await getUserPostCount(user.id), lastActive: user.lastActive || user.createdAt };
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
}

export const createUser = async (userData: CreateUserParams): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const now = new Date();
  const newUser: User = {
    id: `user${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: userData.username,
    email: userData.email,
    password: userData.password,
    isAdmin: userData.isAdmin ?? false,
    createdAt: now,
    lastActive: userData.lastActive,
    aboutMe: userData.aboutMe || `Hello, I'm ${userData.username}!`,
    location: userData.location,
    websiteUrl: userData.websiteUrl,
    socialMediaUrl: userData.socialMediaUrl,
    signature: userData.signature || `Regards, ${userData.username}`,
    avatarUrl: `https://avatar.vercel.sh/${userData.username}.png?size=128`,
    postCount: 0,
  };
  users.push(newUser);
  console.log("[DB createUser] Created User:", newUser.id, newUser.username, `isAdmin: ${newUser.isAdmin}`);
  return { ...newUser };
};

export const updateUserProfile = async (userId: string, profileData: Partial<Omit<User, 'id' | 'email' | 'password' | 'isAdmin' | 'createdAt' | 'postCount'>>): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    users[userIndex] = {
        ...users[userIndex],
        ...profileData,
        lastActive: new Date()
    };
    return { ...users[userIndex], postCount: await getUserPostCount(userId) };
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
    console.log(`[DB updateUserPassword] Password updated for user ${userId}`);
    return { success: true };
};


export const setUserAdminStatus = async (userId: string, isAdmin: boolean): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.error("[DB setUserAdminStatus] Set Admin Status failed: User not found.");
        return null;
    }
    users[userIndex].isAdmin = isAdmin;
    users[userIndex].lastActive = new Date();
    console.log(`[DB setUserAdminStatus] Set admin status for user ${userId} to ${isAdmin}`);
    return { ...users[userIndex], postCount: await getUserPostCount(userId) };
}

export const deleteUser = async (userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);

    if (users.length < initialLength) {
        console.log(`[DB deleteUser] User ${userId} successfully deleted.`);
        // Also delete their conversations and messages
        conversations = conversations.filter(c => !c.participantIds.includes(userId));
        privateMessages = privateMessages.filter(pm => pm.senderId !== userId && !conversations.find(c => c.id === pm.conversationId && c.participantIds.includes(userId)));
        return true;
    } else {
        console.error(`[DB deleteUser] Delete User failed: User ${userId} not found.`);
        return false;
    }
}


// Fetch Categories
export const getCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 20));
   return categories.map(cat => ({
    ...cat,
    topicCount: topics.filter(t => t.categoryId === cat.id).length,
    postCount: posts.filter(p => topics.some(t => t.id === p.topicId && t.categoryId === cat.id)).length
  })).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const category = categories.find(c => c.id === id);
    if (!category) return null;
    return {
        ...category,
        topicCount: topics.filter(t => t.categoryId === id).length,
        postCount: posts.filter(p => topics.some(t => t.id === p.topicId && t.categoryId === id)).length
    };
}

export const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'topicCount' | 'postCount'>): Promise<Category> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const newCategory: Category = {
        ...categoryData,
        id: `cat${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date(),
        topicCount: 0,
        postCount: 0,
    };
    categories.push(newCategory);
    console.log("[DB createCategory] Created Category:", newCategory.id, newCategory.name);
    return { ...newCategory };
}

export const updateCategory = async (categoryId: string, data: { name: string; description?: string }): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const catIndex = categories.findIndex(c => c.id === categoryId);
    if (catIndex === -1) {
        console.error("[DB updateCategory] Update Category failed: Category not found.");
        return null;
    }
    categories[catIndex] = { ...categories[catIndex], ...data };
    console.log("[DB updateCategory] Updated Category:", categories[catIndex].id);
    return { ...categories[catIndex] };
}

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const initialLength = categories.length;
    const topicsToDelete = topics.filter(t => t.categoryId === categoryId).map(t => t.id);
    categories = categories.filter(c => c.id !== categoryId);
    topics = topics.filter(t => t.categoryId !== categoryId);
    posts = posts.filter(p => !topicsToDelete.includes(p.topicId));

    if (categories.length < initialLength) {
        console.log(`[DB deleteCategory] Category ${categoryId} and its topics/posts deleted.`);
        return true;
    } else {
        console.error(`[DB deleteCategory] Delete Category failed: Category ${categoryId} not found.`);
        return false;
    }
}


// Fetch Topics
export const getTopicsByCategory = async (categoryId: string): Promise<Topic[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const categoryTopics = topics
    .filter(t => t.categoryId === categoryId)
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

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
        title: topicData.title,
        categoryId: topicData.categoryId,
        authorId: topicData.authorId,
        id: `topic${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        lastActivity: now,
        postCount: 0, 
    };
    topics.push(newTopic);
    console.log("[DB createTopic] Created Topic:", newTopic.id, newTopic.title);
    await updateUserLastActive(topicData.authorId);

    await createPost({ 
        content: topicData.firstPostContent,
        topicId: newTopic.id,
        authorId: topicData.authorId,
        imageUrl: topicData.firstPostImageUrl,
    });

    const catIndex = categories.findIndex(c => c.id === topicData.categoryId);
     if (catIndex !== -1) {
        categories[catIndex].topicCount = (categories[catIndex].topicCount || 0) + 1;
    }
    
    const finalTopic = await getTopicById(newTopic.id);
    return finalTopic || { ...newTopic, postCount: 1 }; 
}

// Fetch Posts
export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
  await new Promise(resolve => setTimeout(resolve, 20));
  const topicPosts = posts.filter(p => p.topicId === topicId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return Promise.all(topicPosts.map(async post => {
    const author = await findUserById(post.authorId);
    const topic = await getTopicByIdSimple(post.topicId); 
    return { ...post, author, topic: topic ?? undefined };
  }));
};

export const getUserPostCount = async (userId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return posts.filter(p => p.authorId === userId).length;
};

interface CreatePostParams extends Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'topic'> {
    imageUrl?: string;
}

export const createPost = async (postData: CreatePostParams): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const now = new Date();
    const newPost: Post = {
        content: postData.content,
        topicId: postData.topicId,
        authorId: postData.authorId,
        imageUrl: postData.imageUrl,
        id: `post${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
    };
    posts.push(newPost);
    console.log(`[DB createPost] Created Post: ${newPost.id} in Topic ${newPost.topicId}`);
    await updateUserLastActive(postData.authorId);

    const topicIndex = topics.findIndex(t => t.id === postData.topicId);
    if (topicIndex !== -1) {
        topics[topicIndex].lastActivity = now;
        topics[topicIndex].postCount = (topics[topicIndex].postCount || 0) + 1;
        const categoryId = topics[topicIndex].categoryId;
        const catIndex = categories.findIndex(c => c.id === categoryId);
        if (catIndex !== -1) {
            categories[catIndex].postCount = (categories[catIndex].postCount || 0) + 1;
        }
    } else {
         console.warn(`[DB createPost] Topic ${postData.topicId} not found when trying to update counts/activity.`);
    }

    const author = await findUserById(newPost.authorId);
    const topic = await getTopicByIdSimple(newPost.topicId);
    return { ...newPost, author: author ?? undefined, topic: topic ?? undefined };
};

export const updatePost = async (postId: string, content: string, userId: string, imageUrl?: string | null): Promise<Post | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        console.error("[DB updatePost] Update failed: Post not found.");
        return null;
    }

    const post = posts[postIndex];
    const user = await findUserById(userId);
    const canModify = user?.isAdmin || post.authorId === userId;

    if (!canModify) {
        console.error("[DB updatePost] Update failed: User not authorized.");
        return null;
    }
    await updateUserLastActive(userId);

    post.content = content;
    if (imageUrl === null) { 
        delete post.imageUrl;
    } else if (imageUrl !== undefined) { 
        post.imageUrl = imageUrl;
    }

    post.updatedAt = new Date();
    const author = await findUserById(post.authorId);
    const topic = await getTopicByIdSimple(post.topicId);
    return { ...post, author: author ?? undefined, topic: topic ?? undefined };
};

export const deletePost = async (postId: string, userId: string, isAdmin: boolean): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const postIndex = posts.findIndex(p => p.id === postId);
     if (postIndex === -1) {
        return false;
    }

    const postToDelete = posts[postIndex];
    const canDelete = isAdmin || postToDelete.authorId === userId;

     if (!canDelete) {
        return false;
    }
    await updateUserLastActive(userId);

    const deletedPost = posts.splice(postIndex, 1)[0];

     const topicIndex = topics.findIndex(t => t.id === deletedPost.topicId);
    if (topicIndex !== -1) {
        const currentTopic = topics[topicIndex];
        currentTopic.postCount = Math.max(0, (currentTopic.postCount || 1) - 1);
        const categoryId = currentTopic.categoryId;
        const catIndex = categories.findIndex(c => c.id === categoryId);
        if (catIndex !== -1) {
            categories[catIndex].postCount = Math.max(0, (categories[catIndex].postCount || 1) - 1);
        }
    }
    return true;
};

// --- Count Functions for Admin Dashboard ---
export const getTotalUserCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return users.length;
};

export const getTotalCategoryCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return categories.length;
};

export const getTotalTopicCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return topics.length;
};

export const getTotalPostCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return posts.length;
};

// --- Notification Functions ---
export const createNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const newNotification: Notification = {
        ...data,
        id: `notif${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date(),
        isRead: false,
    };
    notifications.push(newNotification);
    console.log(`[DB createNotification] Created Notification for ${data.mentionedUserId} by ${data.mentionerUsername}`);
    return { ...newNotification };
};

export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return notifications
        .filter(n => n.mentionedUserId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); 
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return notifications.filter(n => n.mentionedUserId === userId && !n.isRead).length;
};

export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.mentionedUserId === userId);
    if (notificationIndex !== -1) {
        notifications[notificationIndex].isRead = true;
        console.log(`[DB markNotificationAsRead] Marked notification ${notificationId} as read for user ${userId}`);
        return true;
    }
    return false;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    let markedAny = false;
    notifications.forEach(n => {
        if (n.mentionedUserId === userId && !n.isRead) {
            n.isRead = true;
            markedAny = true;
        }
    });
    if (markedAny) console.log(`[DB markAllNotificationsAsRead] Marked all unread notifications as read for user ${userId}`);
    return markedAny;
};


// --- Private Messaging Functions ---

export const generateConversationId = (userId1: string, userId2: string): string => {
    const ids = [userId1, userId2].sort();
    return `conv-${ids[0]}__${ids[1]}`; // Use double underscore as delimiter
};

export const getOrCreateConversation = async (userId1: string, userId2: string, subject?: string): Promise<Conversation> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const conversationId = generateConversationId(userId1, userId2);
    let conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) {
        const now = new Date();
        conversation = {
            id: conversationId,
            participantIds: [userId1, userId2],
            subject: subject, // Set subject here
            createdAt: now,
            lastMessageAt: now, 
        };
        conversations.push(conversation);
        console.log(`[DB getOrCreateConversation] Created new conversation: ${conversationId} with subject: "${subject || 'N/A'}"`);
    } else if (subject && !conversation.subject) {
        // If conversation exists but has no subject, and a subject is provided, update it.
        // This could happen if a conversation was implicitly created by a message without subject.
        conversation.subject = subject;
        const convIndex = conversations.findIndex(c => c.id === conversationId);
        if (convIndex !== -1) {
            conversations[convIndex].subject = subject;
        }
        console.log(`[DB getOrCreateConversation] Updated existing conversation ${conversationId} with subject: "${subject}"`);
    }
    return { ...conversation };
};

export const sendPrivateMessage = async (
    senderId: string,
    receiverId: string, 
    content: string
): Promise<PrivateMessage> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    // When sending a message, we don't provide a subject here.
    // Subject is set when the conversation is explicitly started with one, or not at all.
    const conversation = await getOrCreateConversation(senderId, receiverId); 
    const now = new Date();

    const newMessage: PrivateMessage = {
        id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
        // Do not overwrite subject here. It's set by getOrCreateConversation if new.
    }
    await updateUserLastActive(senderId);
    console.log(`[DB sendPrivateMessage] Sent PM ${newMessage.id} in conversation ${conversation.id}`);
    return { ...newMessage };
};

export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    return conversations
        .filter(c => c.participantIds.includes(userId))
        .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
};

export const getMessagesForConversation = async (conversationId: string, currentUserId: string, markAsRead: boolean = true): Promise<PrivateMessage[]> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    const messagesInConv = privateMessages
        .filter(pm => pm.conversationId === conversationId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (markAsRead) {
        messagesInConv.forEach(msg => {
            if (msg.senderId !== currentUserId && !msg.readBy.includes(currentUserId)) {
                msg.readBy.push(currentUserId);
                const pmIndex = privateMessages.findIndex(pm => pm.id === msg.id);
                if (pmIndex !== -1) {
                    privateMessages[pmIndex] = msg;
                }
            }
        });
        // console.log(`[DB getMessagesForConversation] Fetched messages for ${conversationId} and marked as read for ${currentUserId}`);
    } else {
        // console.log(`[DB getMessagesForConversation] Fetched messages for ${conversationId} (read status not changed)`);
    }
    return messagesInConv;
};

export const getUnreadPrivateMessagesCountForConversation = async (conversationId: string, userId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return privateMessages.filter(pm => 
        pm.conversationId === conversationId &&
        pm.senderId !== userId &&
        !pm.readBy.includes(userId)
    ).length;
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

// Initialize with a few users for testing if needed
// For a truly empty DB on start, keep users array empty.
// Example User Reset:
// users = [];
// categories = [
//   { id: 'cat1', name: 'General Discussion', description: 'Talk about anything.', createdAt: new Date('2023-01-10T09:00:00Z'), topicCount: 0, postCount: 0 },
//   { id: 'cat2', name: 'Introductions', description: 'Introduce yourself to the community.', createdAt: new Date('2023-01-10T09:05:00Z'), topicCount: 0, postCount: 0 },
// ];
// topics = [];
// posts = [];
// notifications = [];
// conversations = [];
// privateMessages = [];
// console.log("Placeholder data reset.");
