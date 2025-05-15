
import type { User, Category, Topic, Post, Notification, Conversation, PrivateMessage, Reaction, ReactionType, CategoryLastPostInfo, EventDetails, EventType, SiteSettings, EventWidgetPosition, EventWidgetDetailLevel } from './types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs in placeholder
import { unstable_noStore as noStore } from 'next/cache'; 
import { generateSlug } from './utils'; // Import generateSlug

let users: User[] = [];
let categories: Omit<Category, 'topicCount' | 'postCount' | 'lastPost'>[] = [];
let topics: Topic[] = [];
let posts: Post[] = [];
let notifications: Notification[] = [];
let conversations: Conversation[] = [];
let privateMessages: PrivateMessage[] = [];
let events: EventDetails[] = [];
let siteSettings: Partial<SiteSettings> = {
    events_widget_enabled: true,
    events_widget_position: 'above_categories',
    events_widget_detail_level: 'full',
    events_widget_item_count: 3,
    events_widget_title: "Upcoming Events & Webinars",
    multilingual_enabled: false,
    default_language: 'en',
};


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
    const userIndex = users.findIndex(u => u.id === postAuthorId);
    if (userIndex !== -1) {
        users[userIndex].points = totalPoints;
    }
    return totalPoints;
};


export const getAllUsers = async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return Promise.all(users.map(async user => ({
        ...user,
        postCount: posts.filter(p => p.authorId === user.id).length,
        points: user.points ?? await calculateUserPoints(user.id),
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
    language?: 'en' | 'de';
}

export const createUser = async (userData: CreateUserParams): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const now = new Date();
  const newUser: User = {
    id: uuidv4(),
    username: userData.username,
    email: userData.email,
    password: userData.password,
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
    language: userData.language || 'en',
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
        posts.forEach(p => { if (p.authorId === userId) p.authorId = 'deleted_user'; });
        notifications = notifications.filter(n => n.senderId !== userId && n.recipientUserId !== userId);
        events = events.filter(_ => true); // Assuming events are not user-specific for now
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
              topicSlug: latestPostTopic.slug,
              authorId: latestPostAuthor.id,
              authorUsername: latestPostAuthor.username,
              authorAvatarUrl: latestPostAuthor.avatarUrl,
              createdAt: new Date(latestPostData.createdAt),
            };
          }
        }
      }
      return { ...catData, topicCount, postCount, lastPost, createdAt: new Date(catData.createdAt) };
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
            topicSlug: latestPostTopic.slug,
            authorId: latestPostAuthor.id,
            authorUsername: latestPostAuthor.username,
            authorAvatarUrl: latestPostAuthor.avatarUrl,
            createdAt: new Date(latestPostData.createdAt),
          };
        }
      }
    }
    return { ...categoryData, topicCount, postCount, lastPost, createdAt: new Date(categoryData.createdAt) };
}

export const createCategory = async (categoryData: Pick<Category, 'name' | 'description'>): Promise<Category> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const slug = generateSlug(categoryData.name);
    const newCategoryData: Omit<Category, 'topicCount' | 'postCount' | 'lastPost'> = {
        id: uuidv4(),
        name: categoryData.name,
        slug: slug,
        description: categoryData.description,
        createdAt: new Date(),
    };
    categories.push(newCategoryData);
    return { ...newCategoryData, topicCount: 0, postCount: 0, lastPost: null, createdAt: new Date(newCategoryData.createdAt) };
}

export const updateCategory = async (categoryId: string, data: { name: string; description?: string }): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const catIndex = categories.findIndex(c => c.id === categoryId);
    if (catIndex === -1) return null;
    const newSlug = generateSlug(data.name);
    categories[catIndex] = { ...categories[catIndex], ...data, slug: newSlug };
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
    const topicPosts = posts.filter(p => p.topicId === topic.id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstPost = topicPosts[0];
    let snippet = '';
    if (firstPost && firstPost.content) {
        snippet = firstPost.content.replace(/\s\s+/g, ' ').trim();
        if (snippet.length > 155) {
            snippet = snippet.substring(0, 152).trim() + "...";
        }
    }
    const category = await getCategoryById(topic.categoryId);
    return { 
        ...topic, 
        author, 
        category: category || undefined,
        postCount: topicPosts.length, 
        createdAt: new Date(topic.createdAt), 
        lastActivity: new Date(topic.lastActivity),
        firstPostContentSnippet: snippet,
        firstPostImageUrl: firstPost?.imageUrl 
    };
  }));
};

export const getTopicById = async (id: string): Promise<Topic | null> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    const topicData = topics.find(t => t.id === id);
    if (!topicData) return null;

    const author = await findUserById(topicData.authorId);
    const category = await getCategoryById(topicData.categoryId);
    const topicPosts = posts.filter(p => p.topicId === id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstPost = topicPosts[0];

    let firstPostContentSnippet = '';
    let firstPostImageUrl: string | undefined = undefined;

    if (firstPost && firstPost.content) {
        firstPostContentSnippet = firstPost.content.replace(/\s\s+/g, ' ').trim();
        if (firstPostContentSnippet.length > 155) {
            firstPostContentSnippet = firstPostContentSnippet.substring(0, 152).trim() + "...";
        }
        firstPostImageUrl = firstPost.imageUrl;
    }
    
    return { 
        ...topicData, 
        author, 
        category: category || undefined, 
        postCount: topicPosts.length, 
        createdAt: new Date(topicData.createdAt), 
        lastActivity: new Date(topicData.lastActivity),
        firstPostContentSnippet,
        firstPostImageUrl
    };
}

export const getTopicByIdSimple = async (id: string): Promise<Pick<Topic, 'id' | 'title' | 'slug' | 'categoryId' | 'authorId' | 'createdAt' | 'lastActivity'> | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const topic = topics.find(t => t.id === id);
    return topic ? { ...topic, createdAt: new Date(topic.createdAt), lastActivity: new Date(topic.lastActivity) } : null;
}


interface CreateTopicParams extends Omit<Topic, 'id' | 'slug' | 'createdAt' | 'lastActivity' | 'postCount' | 'author' | 'category' | 'firstPostContentSnippet' | 'firstPostImageUrl'> {
    firstPostContent: string;
    firstPostImageUrl?: string;
}

export const createTopic = async (topicData: CreateTopicParams): Promise<Topic> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const now = new Date();
    const category = await getCategoryById(topicData.categoryId);
    if (!category) throw new Error(`Placeholder: Category with ID ${topicData.categoryId} not found.`);
    const slug = generateSlug(`${category.name} ${topicData.title}`);

    const newTopicData: Topic = {
        id: uuidv4(),
        title: topicData.title,
        slug: slug,
        categoryId: topicData.categoryId,
        authorId: topicData.authorId,
        createdAt: now,
        lastActivity: now,
        postCount: 0, 
        firstPostContentSnippet: '', 
        firstPostImageUrl: topicData.firstPostImageUrl,
    };
    topics.push(newTopicData);
    await updateUserLastActive(topicData.authorId);

    const firstPost = await createPost({
        content: topicData.firstPostContent,
        topicId: newTopicData.id,
        authorId: topicData.authorId,
        imageUrl: topicData.firstPostImageUrl,
    });

    let snippet = '';
    if (firstPost.content) {
        snippet = firstPost.content.replace(/\s\s+/g, ' ').trim();
        if (snippet.length > 155) {
            snippet = snippet.substring(0, 152).trim() + "...";
        }
    }
    const topicIndex = topics.findIndex(t => t.id === newTopicData.id);
    if (topicIndex !== -1) {
        topics[topicIndex].firstPostContentSnippet = snippet;
        topics[topicIndex].firstPostImageUrl = firstPost.imageUrl;
        topics[topicIndex].postCount = 1; 
    }

    const finalTopic = await getTopicById(newTopicData.id);
    return finalTopic || { ...topics[topicIndex], postCount: 1, createdAt: new Date(topics[topicIndex].createdAt), lastActivity: new Date(topics[topicIndex].lastActivity) };
}


export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
  await new Promise(resolve => setTimeout(resolve, 20));
  const topicPosts = posts.filter(p => p.topicId === topicId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return Promise.all(topicPosts.map(async post => {
    const author = await findUserById(post.authorId);
    const topicData = await getTopicByIdSimple(post.topicId);
    return { ...post, author, topic: topicData ?? undefined, reactions: post.reactions || [], createdAt: new Date(post.createdAt), updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined };
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
    return { ...newPost, author: author ?? undefined, topic: topic ?? undefined, createdAt: new Date(newPost.createdAt) };
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
    return { ...post, author: author ?? undefined, topic: topic ?? undefined, reactions: post.reactions || [], createdAt: new Date(post.createdAt), updatedAt: new Date(post.updatedAt!) };
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
    notifications = notifications.filter(n => n.postId !== postId);
    const topicIndex = topics.findIndex(t => t.id === deletedPost.topicId);
    if (topicIndex !== -1) {
        topics[topicIndex].postCount = Math.max(0, (topics[topicIndex].postCount || 1) - 1);
    }
    if (deletedPost.authorId && deletedPost.authorId !== 'deleted_user') await calculateUserPoints(deletedPost.authorId);
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
  await calculateUserPoints(post.authorId);

  const author = await findUserById(post.authorId);
  const topic = await getTopicByIdSimple(post.topicId);
  return { ...post, author: author ?? undefined, topic: topic ?? undefined, reactions: [...post.reactions], createdAt: new Date(post.createdAt), updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined };
};


export const getTotalUserCount = async (): Promise<number> => (users.length);
export const getTotalCategoryCount = async (): Promise<number> => (categories.length);
export const getTotalTopicCount = async (): Promise<number> => (topics.length);
export const getTotalPostCount = async (): Promise<number> => (posts.length);


export const createNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    let topicSlug = data.topicSlug;
    if (data.topicId && !data.topicSlug) {
        const topic = await getTopicByIdSimple(data.topicId);
        topicSlug = topic?.slug;
    }
    const newNotification: Notification = {
        id: uuidv4(),
        ...data,
        topicSlug,
        createdAt: new Date(),
        isRead: false,
    };
    notifications.push(newNotification);
    return { ...newNotification, createdAt: new Date(newNotification.createdAt) };
};

export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return Promise.all(
        notifications
            .filter(n => n.recipientUserId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(async n => {
                let topicSlug = n.topicSlug;
                if (n.topicId && !n.topicSlug) {
                    const topic = await getTopicByIdSimple(n.topicId);
                    topicSlug = topic?.slug;
                }
                return { ...n, topicSlug, createdAt: new Date(n.createdAt) };
            })
    );
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
    return { ...conversation, createdAt: new Date(conversation.createdAt), lastMessageAt: new Date(conversation.lastMessageAt) };
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
    return { ...newMessage, createdAt: new Date(newMessage.createdAt) };
};

export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    return conversations
        .filter(c => c.participantIds.includes(userId))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        .map(c => ({ ...c, createdAt: new Date(c.createdAt), lastMessageAt: new Date(c.lastMessageAt) }));
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
    return messagesInConv.map(m => ({ ...m, createdAt: new Date(m.createdAt) }));
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
    return conversation ? { ...conversation, createdAt: new Date(conversation.createdAt), lastMessageAt: new Date(conversation.lastMessageAt) } : null;
};

// --- Event Functions (Placeholder) ---
export const createEvent = async (eventData: Omit<EventDetails, 'id' | 'createdAt'>): Promise<EventDetails> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const newEvent: EventDetails = {
        id: uuidv4(),
        ...eventData,
        createdAt: new Date(),
    };
    events.push(newEvent);
    return { ...newEvent, date: new Date(newEvent.date), createdAt: new Date(newEvent.createdAt) };
};

export const getEvents = async (limit?: number): Promise<EventDetails[]> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    const sortedEvents = events
        .filter(event => new Date(event.date) >= new Date(new Date().toDateString())) // Filter for today or future
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
    const results = limit ? sortedEvents.slice(0, limit) : sortedEvents;
    return results.map(e => ({ ...e, date: new Date(e.date), createdAt: new Date(e.createdAt) }));
};

export const getEventById = async (id: string): Promise<EventDetails | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const event = events.find(e => e.id === id);
    return event ? { ...event, date: new Date(event.date), createdAt: new Date(event.createdAt) } : null;
};

export const updateEvent = async (eventId: string, eventData: Partial<Omit<EventDetails, 'id' | 'createdAt'>>): Promise<EventDetails | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return null;
    events[eventIndex] = { ...events[eventIndex], ...eventData };
    return { ...events[eventIndex], date: new Date(events[eventIndex].date), createdAt: new Date(events[eventIndex].createdAt) };
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const initialLength = events.length;
    events = events.filter(e => e.id !== eventId);
    return events.length < initialLength;
};

// --- Site Settings Functions (Placeholder) ---
export const getAllSiteSettings = async (): Promise<SiteSettings> => {
    unstable_noStore(); 
    await new Promise(resolve => setTimeout(resolve, 10));
    const defaults: SiteSettings = {
        events_widget_enabled: true,
        events_widget_position: 'above_categories',
        events_widget_detail_level: 'full',
        events_widget_item_count: 3,
        events_widget_title: "Upcoming Events & Webinars",
        multilingual_enabled: false,
        default_language: 'en',
    };
    
    const isEnabledBoolean = siteSettings.events_widget_enabled !== undefined
        ? String(siteSettings.events_widget_enabled).toLowerCase() === 'true'
        : defaults.events_widget_enabled;

    const title = siteSettings.events_widget_title !== undefined
        ? (siteSettings.events_widget_title || defaults.events_widget_title) 
        : defaults.events_widget_title;


    return {
        events_widget_enabled: isEnabledBoolean,
        events_widget_position: (siteSettings.events_widget_position as EventWidgetPosition) || defaults.events_widget_position,
        events_widget_detail_level: (siteSettings.events_widget_detail_level as EventWidgetDetailLevel) || defaults.events_widget_detail_level,
        events_widget_item_count: siteSettings.events_widget_item_count !== undefined ? Number(siteSettings.events_widget_item_count) : defaults.events_widget_item_count,
        events_widget_title: title,
        multilingual_enabled: siteSettings.multilingual_enabled !== undefined ? String(siteSettings.multilingual_enabled).toLowerCase() === 'true' : defaults.multilingual_enabled,
        default_language: (siteSettings.default_language as 'en' | 'de') || defaults.default_language,
    };
};


export const updateSiteSetting = async (key: keyof SiteSettings, value: any): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    (siteSettings as any)[key] = value;
};


export const initializePlaceholderData = () => {
    if (users.length > 0 && categories.length > 0) {
        console.log("Placeholder data already initialized.");
        return;
    }
    console.warn("Placeholder data arrays are empty. Initializing with defaults.");

    const adminUserPlaceholder: User = {
        id: 'admin-user-placeholder-fallback', username: "admin", email: "admin@forumlite.com",
        password: "password123", isAdmin: true, createdAt: new Date('2023-01-01T10:00:00Z'), lastActive: new Date(),
        aboutMe: "Default administrator account for placeholder data.", points: 0, postCount: 0,
        avatarUrl: 'https://avatar.vercel.sh/admin.png?size=128', language: 'en',
    };
    users = [adminUserPlaceholder];

    const generalCatData: Omit<Category, 'topicCount' | 'postCount' | 'lastPost'> = { id: 'cat1-placeholder-fallback', name: 'General Discussion (Fallback)', slug: 'general-discussion-fallback', description: 'Talk about anything (fallback).', createdAt: new Date('2023-01-10T09:00:00Z') };
    const introCatData: Omit<Category, 'topicCount' | 'postCount' | 'lastPost'> = { id: 'cat2-placeholder-fallback', name: 'Introductions (Fallback)', slug: 'introductions-fallback', description: 'Introduce yourself (fallback).', createdAt: new Date('2023-01-10T09:01:00Z') };
    const techCatData: Omit<Category, 'topicCount' | 'postCount' | 'lastPost'> = { id: 'cat3-placeholder-fallback', name: 'Tech Help (Fallback)', slug: 'tech-help-fallback', description: 'Get tech help (fallback).', createdAt: new Date('2023-01-10T09:02:00Z') };
    categories = [generalCatData, introCatData, techCatData];

    const welcomeTopicPlaceholder: Topic = {
        id: 'topic1-placeholder-fallback', title: "Welcome to ForumLite (Fallback)", slug: generateSlug(`${generalCatData.name} Welcome to ForumLite (Fallback)`), categoryId: generalCatData.id,
        authorId: adminUserPlaceholder.id, createdAt: new Date('2023-01-10T10:00:00Z'), lastActivity: new Date('2023-01-10T10:05:00Z'), postCount: 1,
        firstPostContentSnippet: "This is the first topic on ForumLite. Feel free to look around and start discussions!",
        firstPostImageUrl: undefined,
    };
    const techTopicPlaceholder: Topic = {
        id: 'topic2-placeholder-fallback', title: "PC Problems (Fallback)", slug: generateSlug(`${techCatData.name} PC Problems (Fallback)`), categoryId: techCatData.id,
        authorId: adminUserPlaceholder.id, createdAt: new Date('2023-01-11T11:00:00Z'), lastActivity: new Date('2023-01-11T11:00:00Z'), postCount: 1,
        firstPostContentSnippet: "Post your technical issues here and the community might be able to help.",
        firstPostImageUrl: undefined,
    };
    topics = [welcomeTopicPlaceholder, techTopicPlaceholder];

    posts = [
        { id: 'post1-placeholder-fallback', content: "This is the first post in the fallback placeholder topic.", topicId: welcomeTopicPlaceholder.id, authorId: adminUserPlaceholder.id, createdAt: new Date('2023-01-10T10:00:00Z'), reactions: [] },
        { id: 'post2-placeholder-fallback', content: "Post your tech issues here (fallback).", topicId: techTopicPlaceholder.id, authorId: adminUserPlaceholder.id, createdAt: new Date('2023-01-11T11:00:00Z'), reactions: [] }
    ];

    events = [
        { id: 'event1-placeholder', title: 'Community Meetup (Placeholder)', type: 'event', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), time: '18:00', description: 'Join us for a virtual community meetup!', link: '#', createdAt: new Date() },
        { id: 'event2-placeholder', title: 'Next.js Webinar (Placeholder)', type: 'webinar', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), time: '10:00', description: 'Learn about the latest Next.js features.', link: '#', createdAt: new Date() },
    ];
    
    siteSettings = {
        events_widget_enabled: true,
        events_widget_position: 'above_categories',
        events_widget_detail_level: 'full',
        events_widget_item_count: 3,
        events_widget_title: "Upcoming Events & Webinars",
        multilingual_enabled: false,
        default_language: 'en',
    };

    console.log("Placeholder data initialized with defaults.");
};


if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
    initializePlaceholderData();
}


export const _resetPlaceholderData = () => {
    users = [];
    categories = [];
    topics = [];
    posts = [];
    notifications = [];
    conversations = [];
    privateMessages = [];
    events = [];
    siteSettings = {
        events_widget_enabled: true,
        events_widget_position: 'above_categories',
        events_widget_detail_level: 'full',
        events_widget_item_count: 3,
        events_widget_title: "Upcoming Events & Webinars",
        multilingual_enabled: false,
        default_language: 'en',
    };
    console.log("Placeholder data has been reset.");
    initializePlaceholderData(); 
};

export const _getPlaceholderData = () => ({
    users, categories, topics, posts, notifications, conversations, privateMessages, events, siteSettings
});

