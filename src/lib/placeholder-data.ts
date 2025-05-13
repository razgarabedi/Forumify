
import type { User, Category, Topic, Post } from './types';
import { revalidatePath } from 'next/cache';

// Placeholder Users - Reset to empty
let users: User[] = [];

// Placeholder Categories
let categories: Category[] = [
  { id: 'cat1', name: 'General Discussion', description: 'Talk about anything.', createdAt: new Date('2023-01-10T09:00:00Z'), topicCount: 0, postCount: 0 }, // Reset counts
  { id: 'cat2', name: 'Introductions', description: 'Introduce yourself to the community.', createdAt: new Date('2023-01-10T09:05:00Z'), topicCount: 0, postCount: 0 }, // Reset counts
  { id: 'cat3', name: 'Technical Help', description: 'Get help with technical issues.', createdAt: new Date('2023-01-11T14:00:00Z'), topicCount: 0, postCount: 0 }, // Reset counts
];

// Placeholder Topics - Reset to empty as users are gone
let topics: Topic[] = [];

// Placeholder Posts - Reset to empty as topics/users are gone
let posts: Post[] = [];

// --- Simulation Functions ---

// Fetch Users
export const getAllUsers = async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 10)); // Shorter delay
    // Return a copy to prevent direct modification outside controlled functions
    return users.map(user => ({
        ...user,
        postCount: posts.filter(p => p.authorId === user.id).length
    }));
};


export const findUserByEmail = async (email: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 10)); // Shorter delay
  const user = users.find(u => u.email === email);
  if (!user) return null;
  return { ...user, postCount: await getUserPostCount(user.id), lastActive: user.lastActive || user.createdAt }; // Return a copy with postCount
};

export const findUserById = async (id: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 10)); // Shorter delay
    const user = users.find(u => u.id === id);
    if (!user) return null;
    return { ...user, postCount: await getUserPostCount(user.id), lastActive: user.lastActive || user.createdAt }; // Return a copy with postCount
}

export const findUserByUsername = async (username: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    console.log(`[DB findUserByUsername] Attempting to find user with username: "${username}" (lowercase: "${username.toLowerCase()}")`);
    console.log(`[DB findUserByUsername] Current users in DB (${users.length}):`, users.map(u => ({id: u.id, username: u.username, lcUsername: u.username.toLowerCase()})));
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        console.warn(`[DB findUserByUsername] User "${username}" NOT FOUND.`);
        return null;
    }
    console.log(`[DB findUserByUsername] User "${username}" FOUND. ID: ${user.id}`);
    return { ...user, postCount: await getUserPostCount(user.id), lastActive: user.lastActive || user.createdAt };
};


// Define the expected structure for userData passed to createUser
interface CreateUserParams {
    username: string;
    email: string;
    password?: string; // Password from form
    isAdmin?: boolean; // Accept isAdmin flag
    aboutMe?: string;
    location?: string;
    websiteUrl?: string;
    socialMediaUrl?: string;
    signature?: string;
}

export const createUser = async (userData: CreateUserParams): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
  const now = new Date();
  const newUser: User = {
    id: `user${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
    username: userData.username,
    email: userData.email,
    password: userData.password, // Storing plain text for placeholder
    isAdmin: userData.isAdmin ?? false,
    createdAt: now,
    lastActive: now, // Set lastActive on creation
    aboutMe: userData.aboutMe || `Hello, I'm ${userData.username}!`, // Default about me
    location: userData.location,
    websiteUrl: userData.websiteUrl,
    socialMediaUrl: userData.socialMediaUrl,
    signature: userData.signature || `Regards, ${userData.username}`, // Default signature
    avatarUrl: `https://avatar.vercel.sh/${userData.username}.png?size=128`, // Default avatar
    postCount: 0,
  };
  users.push(newUser);
  console.log("[DB createUser] Created User:", newUser.id, newUser.username, `isAdmin: ${newUser.isAdmin}`);
  return { ...newUser }; // Return a copy
};

export const updateUserProfile = async (userId: string, profileData: Partial<Omit<User, 'id' | 'email' | 'password' | 'isAdmin' | 'createdAt' | 'postCount'>>): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    users[userIndex] = {
        ...users[userIndex],
        ...profileData,
        lastActive: new Date() // Update last active on profile update
    };
    revalidatePath(`/users/${users[userIndex].username}`);
    revalidatePath(`/`); // General revalidation
    return { ...users[userIndex], postCount: await getUserPostCount(userId) };
};


export const updateUserLastActive = async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].lastActive = new Date();
        // console.log(`[DB updateUserLastActive] Updated lastActive for user ${userId} to ${users[userIndex].lastActive}`);
    }
};


// Admin Actions for Users
export const setUserAdminStatus = async (userId: string, isAdmin: boolean): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.error("[DB setUserAdminStatus] Set Admin Status failed: User not found.");
        return null;
    }
    users[userIndex].isAdmin = isAdmin;
    users[userIndex].lastActive = new Date();
    console.log(`[DB setUserAdminStatus] Set admin status for user ${userId} to ${isAdmin}`);
    return { ...users[userIndex], postCount: await getUserPostCount(userId) }; // Return a copy
}

export const deleteUser = async (userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);

     console.log(`[DB deleteUser] User ${userId} deleted. Posts/Topics may remain under original authorId.`);

    if (users.length < initialLength) {
        console.log(`[DB deleteUser] User ${userId} successfully deleted.`);
        return true;
    } else {
        console.error(`[DB deleteUser] Delete User failed: User ${userId} not found.`);
        return false;
    }
}


// Fetch Categories
export const getCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 20)); // Shorter delay
   return categories.map(cat => ({
    ...cat,
    topicCount: topics.filter(t => t.categoryId === cat.id).length,
    postCount: posts.filter(p => topics.some(t => t.id === p.topicId && t.categoryId === cat.id)).length
  })).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 10)); // Shorter delay
    const category = categories.find(c => c.id === id);
    if (!category) return null;
    return {
        ...category,
        topicCount: topics.filter(t => t.categoryId === id).length,
        postCount: posts.filter(p => topics.some(t => t.id === p.topicId && t.categoryId === id)).length
    };
}

export const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'topicCount' | 'postCount'>): Promise<Category> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
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
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
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
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
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
    return { ...topic, author, postCount: await getUserPostCount(topic.authorId) };
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


interface CreateTopicParams extends Omit<Topic, 'id' | 'createdAt' | 'lastActivity' | 'postCount'> {
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
        postCount: 1,
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

    return { ...newTopic };
}

// Fetch Posts
export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
  await new Promise(resolve => setTimeout(resolve, 20));
  const topicPosts = posts.filter(p => p.topicId === topicId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return Promise.all(topicPosts.map(async post => {
    const author = await findUserById(post.authorId);
    return { ...post, author };
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
    const topic = await getTopicById(newPost.topicId);
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
    const topic = await getTopicById(post.topicId);
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
