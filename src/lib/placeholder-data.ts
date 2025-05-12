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
    return [...users];
};


export const findUserByEmail = async (email: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 10)); // Shorter delay
  // Find user and return the full object (including password for comparison) or null
  const user = users.find(u => u.email === email);
   // console.log(`[DB findUserByEmail] Searching for ${email}, Found:`, user ? user.id : 'null');
  return user ? { ...user } : null; // Return a copy
};

export const findUserById = async (id: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 10)); // Shorter delay
    // Find user and return the full object (including password) or null
    const user = users.find(u => u.id === id);
    // console.log(`[DB findUserById] Searching for ${id}, Found:`, user ? user.id : 'null');
    return user ? { ...user } : null; // Return a copy
}

// Define the expected structure for userData passed to createUser
interface CreateUserParams {
    username: string;
    email: string;
    password?: string; // Password from form
    isAdmin?: boolean; // Accept isAdmin flag
}

export const createUser = async (userData: CreateUserParams): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
  // **IMPORTANT**: In a real app, hash the password *before* saving!
  // const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser: User = {
    username: userData.username,
    email: userData.email,
    // password: hashedPassword, // Store hashed password in real app
    password: userData.password, // Storing plain text for placeholder
    isAdmin: userData.isAdmin ?? false, // Use provided isAdmin flag or default to false
    id: `user${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
    createdAt: new Date(),
  };
  users.push(newUser);
  console.log("[DB createUser] Created User:", newUser.id, newUser.username, `isAdmin: ${newUser.isAdmin}`); // Log new user details including admin status
  // console.log("Current Users:", users.map(u => ({ id: u.id, username: u.username, email: u.email, isAdmin: u.isAdmin }))); // Log current state of users array
  return { ...newUser }; // Return a copy
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
    console.log(`[DB setUserAdminStatus] Set admin status for user ${userId} to ${isAdmin}`);
    // Revalidation is handled by the action calling this function
    // revalidatePath('/admin/users');
    return { ...users[userIndex] }; // Return a copy
}

export const deleteUser = async (userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const initialLength = users.length;
    // Filter out the user to delete
    users = users.filter(u => u.id !== userId);

    // Optional: Handle orphaned content (posts/topics)
    // This placeholder doesn't automatically delete user content,
    // but in a real app you'd decide how to handle this (e.g., anonymize, delete, keep).
     console.log(`[DB deleteUser] User ${userId} deleted. Posts/Topics may remain under original authorId.`);

    if (users.length < initialLength) {
        console.log(`[DB deleteUser] User ${userId} successfully deleted.`);
         // Revalidation handled by action
        // revalidatePath('/admin/users');
        // revalidatePath('/admin');
        // revalidatePath('/');
        return true;
    } else {
        console.error(`[DB deleteUser] Delete User failed: User ${userId} not found.`);
        return false;
    }
}


// Fetch Categories
export const getCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 20)); // Shorter delay
   // Update counts based on current topics/posts
   return categories.map(cat => ({
    ...cat,
    topicCount: topics.filter(t => t.categoryId === cat.id).length,
    postCount: posts.filter(p => topics.some(t => t.id === p.topicId && t.categoryId === cat.id)).length
  })).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Sort by creation date
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 10)); // Shorter delay
    const category = categories.find(c => c.id === id);
    if (!category) return null;
    // Update counts
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
        id: `cat${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
        createdAt: new Date(),
        topicCount: 0,
        postCount: 0,
    };
    categories.push(newCategory);
    console.log("[DB createCategory] Created Category:", newCategory.id, newCategory.name);
     // Revalidation handled by action
    // revalidatePath('/admin/categories');
    // revalidatePath('/');
    return { ...newCategory }; // Return a copy
}

// Admin Actions for Categories
export const updateCategory = async (categoryId: string, data: { name: string; description?: string }): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const catIndex = categories.findIndex(c => c.id === categoryId);
    if (catIndex === -1) {
        console.error("[DB updateCategory] Update Category failed: Category not found.");
        return null;
    }
    categories[catIndex] = { ...categories[catIndex], ...data };
    console.log("[DB updateCategory] Updated Category:", categories[catIndex].id);
     // Revalidation handled by action
    // revalidatePath('/admin/categories');
    // revalidatePath('/');
    // revalidatePath(`/categories/${categoryId}`);
    return { ...categories[catIndex] }; // Return a copy
}

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const initialLength = categories.length;
    // In a real app, decide how to handle topics/posts within the category (e.g., delete them, move them to an archive category)
    // For placeholder: Delete the category, its topics, and their posts.
    const topicsToDelete = topics.filter(t => t.categoryId === categoryId).map(t => t.id);
    categories = categories.filter(c => c.id !== categoryId);
    topics = topics.filter(t => t.categoryId !== categoryId); // Also remove topics in deleted category
    posts = posts.filter(p => !topicsToDelete.includes(p.topicId)); // Remove posts within those topics

    if (categories.length < initialLength) {
        console.log(`[DB deleteCategory] Category ${categoryId} and its topics/posts deleted.`);
         // Revalidation handled by action
        // revalidatePath('/admin/categories');
        // revalidatePath('/');
        return true;
    } else {
        console.error(`[DB deleteCategory] Delete Category failed: Category ${categoryId} not found.`);
        return false;
    }
}


// Fetch Topics
export const getTopicsByCategory = async (categoryId: string): Promise<Topic[]> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
  const categoryTopics = topics
    .filter(t => t.categoryId === categoryId)
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()); // Sort by last activity desc

  // Add author data and update counts
  return Promise.all(categoryTopics.map(async topic => {
    const author = await findUserById(topic.authorId);
    return { ...topic, author, postCount: posts.filter(p => p.topicId === topic.id).length };
  }));
};

// Gets full topic details including author and category objects
export const getTopicById = async (id: string): Promise<Topic | null> => {
    await new Promise(resolve => setTimeout(resolve, 20)); // Shorter delay
    const topic = topics.find(t => t.id === id);
    if (!topic) return null;
    const author = await findUserById(topic.authorId);
    const category = await getCategoryById(topic.categoryId);
    // Update counts
    return { ...topic, author, category, postCount: posts.filter(p => p.topicId === id).length };
}

// Gets only the basic topic data (useful for simple lookups like getting categoryId)
export const getTopicByIdSimple = async (id: string): Promise<Topic | null> => {
    await new Promise(resolve => setTimeout(resolve, 10)); // Shorter delay
    const topic = topics.find(t => t.id === id);
    return topic ? { ...topic } : null; // Return copy or null
}


interface CreateTopicParams extends Omit<Topic, 'id' | 'createdAt' | 'lastActivity' | 'postCount'> {
    firstPostContent: string;
    firstPostImageUrl?: string;
}

export const createTopic = async (topicData: CreateTopicParams): Promise<Topic> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const now = new Date();
    const newTopic: Topic = {
        title: topicData.title,
        categoryId: topicData.categoryId,
        authorId: topicData.authorId,
        id: `topic${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
        createdAt: now,
        lastActivity: now,
        postCount: 1, // Start with 1 post (the initial one)
    };
    topics.push(newTopic);
    console.log("[DB createTopic] Created Topic:", newTopic.id, newTopic.title);

    // Automatically create the first post for the topic
    await createPost({
        content: topicData.firstPostContent,
        topicId: newTopic.id,
        authorId: topicData.authorId,
        imageUrl: topicData.firstPostImageUrl, // Pass imageUrl for the first post
    });

    // Update category topic count
    const catIndex = categories.findIndex(c => c.id === topicData.categoryId);
     if (catIndex !== -1) {
        categories[catIndex].topicCount = (categories[catIndex].topicCount || 0) + 1;
        // Post count for category is handled by createPost
    }

    return { ...newTopic }; // Return a copy
}

// Fetch Posts
export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
  await new Promise(resolve => setTimeout(resolve, 20)); // Shorter delay
  const topicPosts = posts.filter(p => p.topicId === topicId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  // Add author data
  return Promise.all(topicPosts.map(async post => {
    const author = await findUserById(post.authorId);
    return { ...post, author };
  }));
};

interface CreatePostParams extends Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'topic'> {
    imageUrl?: string;
}

export const createPost = async (postData: CreatePostParams): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const now = new Date();
    const newPost: Post = {
        content: postData.content,
        topicId: postData.topicId,
        authorId: postData.authorId,
        imageUrl: postData.imageUrl,
        id: `post${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
        createdAt: now,
    };
    posts.push(newPost);
     console.log(`[DB createPost] Created Post: ${newPost.id} in Topic ${newPost.topicId}`);

    // Update topic's last activity and post count
    const topicIndex = topics.findIndex(t => t.id === postData.topicId);
    if (topicIndex !== -1) {
        topics[topicIndex].lastActivity = now;
        topics[topicIndex].postCount = (topics[topicIndex].postCount || 0) + 1;
         console.log(`[DB createPost] Updated Topic ${topics[topicIndex].id} lastActivity and postCount`);

         // Update category post count via the topic
        const categoryId = topics[topicIndex].categoryId;
        const catIndex = categories.findIndex(c => c.id === categoryId);
        if (catIndex !== -1) {
            categories[catIndex].postCount = (categories[catIndex].postCount || 0) + 1;
             console.log(`[DB createPost] Updated Category ${categories[catIndex].id} postCount`);
        }
    } else {
         console.warn(`[DB createPost] Topic ${postData.topicId} not found when trying to update counts/activity.`);
    }

    // Populate author and topic details for the returned post
    const author = await findUserById(newPost.authorId);
    const topic = await getTopicById(newPost.topicId); // Use existing function
    return { ...newPost, author: author ?? undefined, topic: topic ?? undefined };
};

export const updatePost = async (postId: string, content: string, userId: string, imageUrl?: string | null): Promise<Post | null> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        console.error("[DB updatePost] Update failed: Post not found.");
        return null;
    }

    const post = posts[postIndex];
    const user = await findUserById(userId);
    // Allow admin to edit any post, or author to edit their own
    const canModify = user?.isAdmin || post.authorId === userId;

    if (!canModify) {
        console.error("[DB updatePost] Update failed: User not authorized.");
        return null;
    }

    post.content = content;
    if (imageUrl === null) { // Explicitly removing image
        delete post.imageUrl;
        console.log(`[DB updatePost] Removed image for Post ${postId}`);
    } else if (imageUrl !== undefined) { // Adding or changing image (undefined means don't touch image)
        post.imageUrl = imageUrl;
        console.log(`[DB updatePost] Updated image for Post ${postId}`);
    }
    // If imageUrl is undefined, do nothing to the existing imageUrl

    post.updatedAt = new Date();
    console.log(`[DB updatePost] Updated Post ${postId} Content: ${content.substring(0,30)}...`);
    // Populate author and topic details for the returned post
    const author = await findUserById(post.authorId);
    const topic = await getTopicById(post.topicId);
    return { ...post, author: author ?? undefined, topic: topic ?? undefined };
};

export const deletePost = async (postId: string, userId: string, isAdmin: boolean): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const postIndex = posts.findIndex(p => p.id === postId);
     if (postIndex === -1) {
         console.error("[DB deletePost] Delete failed: Post not found.");
        return false; // Post not found
    }

    const postToDelete = posts[postIndex];
    // Allow admin to delete any post, or author to delete their own
    const canDelete = isAdmin || postToDelete.authorId === userId;

     if (!canDelete) {
         console.error("[DB deletePost] Delete failed: User not authorized.");
        return false; // User not authorized
    }

    const deletedPost = posts.splice(postIndex, 1)[0];

    // Update topic post count
     const topicIndex = topics.findIndex(t => t.id === deletedPost.topicId);
    if (topicIndex !== -1) {
        const currentTopic = topics[topicIndex];
        currentTopic.postCount = Math.max(0, (currentTopic.postCount || 1) - 1);
         console.log(`[DB deletePost] Updated Topic ${currentTopic.id} postCount to ${currentTopic.postCount}`);

        // Update category post count via the topic
        const categoryId = currentTopic.categoryId;
        const catIndex = categories.findIndex(c => c.id === categoryId);
        if (catIndex !== -1) {
            categories[catIndex].postCount = Math.max(0, (categories[catIndex].postCount || 1) - 1);
             console.log(`[DB deletePost] Updated Category ${categories[catIndex].id} postCount to ${categories[catIndex].postCount}`);
        } else {
             console.warn(`[DB deletePost] Category ${categoryId} not found when trying to update post count.`);
        }

        // Optional: Decide if topic should be deleted if empty
        // if (topics[topicIndex].postCount === 0) {
        //     topics.splice(topicIndex, 1);
        //      if (catIndex !== -1) { // Update category topic count if topic is deleted
        //          categories[catIndex].topicCount = Math.max(0, (categories[catIndex].topicCount || 1) - 1);
        //      }
        // }
    } else {
         console.warn(`[DB deletePost] Topic ${deletedPost.topicId} not found when trying to update counts.`);
    }


    console.log("[DB deletePost] Deleted Post ID:", postId);
     // Revalidation handled by action
     // revalidatePath(`/topics/${deletedPost.topicId}`);
     // revalidatePath('/admin');
     // if(topicIndex !== -1 && topics[topicIndex]) revalidatePath(`/categories/${topics[topicIndex].categoryId}`);
    return true;
};

export const getSimulatedUser = async (): Promise<User | null> => {
   // Return null as there are no users initially after reset
   return null;
}

// --- Count Functions for Admin Dashboard ---
export const getTotalUserCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5)); // Shorter delay
    return users.length;
};

export const getTotalCategoryCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5)); // Shorter delay
    return categories.length;
};

export const getTotalTopicCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5)); // Shorter delay
    return topics.length;
};

export const getTotalPostCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 5)); // Shorter delay
    return posts.length;
};