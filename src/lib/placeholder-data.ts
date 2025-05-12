
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
    await new Promise(resolve => setTimeout(resolve, 100));
    // Return a copy to prevent direct modification outside controlled functions
    return [...users];
};


export const findUserByEmail = async (email: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  return users.find(u => u.email === email) || null;
};

export const findUserById = async (id: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return users.find(u => u.id === id) || null;
}

// Define the expected structure for userData passed to createUser
interface CreateUserParams {
    username: string;
    email: string;
    password?: string; // Password from form
    isAdmin?: boolean; // Accept isAdmin flag
}

export const createUser = async (userData: CreateUserParams): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 200));
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
  console.log("Created User:", newUser.id, newUser.username, `isAdmin: ${newUser.isAdmin}`); // Log new user details including admin status
  console.log("Current Users:", users.map(u => ({ id: u.id, username: u.username, email: u.email, isAdmin: u.isAdmin }))); // Log current state of users array
  return newUser;
};

// Admin Actions for Users
export const setUserAdminStatus = async (userId: string, isAdmin: boolean): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.error("Set Admin Status failed: User not found.");
        return null;
    }
    users[userIndex].isAdmin = isAdmin;
    console.log(`Set admin status for user ${userId} to ${isAdmin}`);
    revalidatePath('/admin/users'); // Revalidate user list
    return users[userIndex];
}

export const deleteUser = async (userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const initialLength = users.length;
    // Filter out the user to delete
    users = users.filter(u => u.id !== userId);

    // Optional: Handle orphaned content (posts/topics)
    // This placeholder doesn't automatically delete user content,
    // but in a real app you'd decide how to handle this (e.g., anonymize, delete, keep).
     console.log(`Deleted user ${userId}. Posts/Topics remain under original authorId.`);

    if (users.length < initialLength) {
        console.log(`User ${userId} deleted.`);
        revalidatePath('/admin/users'); // Revalidate user list
        // Also revalidate pages where user counts/details might appear
        revalidatePath('/admin');
        revalidatePath('/');
        return true;
    } else {
        console.error(`Delete User failed: User ${userId} not found.`);
        return false;
    }
}


// Fetch Categories
export const getCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 150));
   // Update counts based on current topics/posts (which are now empty initially)
   return categories.map(cat => ({
    ...cat,
    topicCount: topics.filter(t => t.categoryId === cat.id).length,
    postCount: posts.filter(p => topics.some(t => t.id === p.topicId && t.categoryId === cat.id)).length
  }));
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 50));
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
    await new Promise(resolve => setTimeout(resolve, 200));
    const newCategory: Category = {
        ...categoryData,
        id: `cat${categories.length + 1}${Date.now()}`, // More uniqueness
        createdAt: new Date(),
        topicCount: 0,
        postCount: 0,
    };
    categories.push(newCategory);
    console.log("Created Category:", newCategory);
    revalidatePath('/admin/categories');
    revalidatePath('/');
    return newCategory;
}

// Admin Actions for Categories
export const updateCategory = async (categoryId: string, data: { name: string; description?: string }): Promise<Category | null> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const catIndex = categories.findIndex(c => c.id === categoryId);
    if (catIndex === -1) {
        console.error("Update Category failed: Category not found.");
        return null;
    }
    categories[catIndex] = { ...categories[catIndex], ...data };
    console.log("Updated Category:", categories[catIndex]);
    revalidatePath('/admin/categories');
    revalidatePath('/');
    revalidatePath(`/categories/${categoryId}`);
    return categories[catIndex];
}

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const initialLength = categories.length;
    // In a real app, decide how to handle topics/posts within the category (e.g., delete them, move them to an archive category)
    // For placeholder: Just delete the category itself. Topics/posts become orphaned (their categoryId points to nothing).
    const topicsToDelete = topics.filter(t => t.categoryId === categoryId).map(t => t.id);
    categories = categories.filter(c => c.id !== categoryId);
    topics = topics.filter(t => t.categoryId !== categoryId); // Also remove topics in deleted category
    posts = posts.filter(p => !topicsToDelete.includes(p.topicId)); // Remove posts within those topics

    if (categories.length < initialLength) {
        console.log(`Category ${categoryId} and its topics/posts deleted.`);
        revalidatePath('/admin/categories');
        revalidatePath('/');
        // Revalidate specific category pages is difficult now it's gone
        return true;
    } else {
        console.error(`Delete Category failed: Category ${categoryId} not found.`);
        return false;
    }
}


// Fetch Topics
export const getTopicsByCategory = async (categoryId: string): Promise<Topic[]> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  const categoryTopics = topics.filter(t => t.categoryId === categoryId);
  // Add author data and update counts
  return Promise.all(categoryTopics.map(async topic => {
    const author = await findUserById(topic.authorId);
    return { ...topic, author, postCount: posts.filter(p => p.topicId === topic.id).length };
  }));
};

export const getTopicById = async (id: string): Promise<Topic | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const topic = topics.find(t => t.id === id);
    if (!topic) return null;
    const author = await findUserById(topic.authorId);
    const category = await getCategoryById(topic.categoryId);
    // Update counts
    return { ...topic, author, category, postCount: posts.filter(p => p.topicId === id).length };
}

interface CreateTopicParams extends Omit<Topic, 'id' | 'createdAt' | 'lastActivity' | 'postCount'> {
    firstPostContent: string;
    firstPostImageUrl?: string;
}

export const createTopic = async (topicData: CreateTopicParams): Promise<Topic> => {
    await new Promise(resolve => setTimeout(resolve, 250));
    const now = new Date();
    const newTopic: Topic = {
        title: topicData.title,
        categoryId: topicData.categoryId,
        authorId: topicData.authorId,
        id: `topic${topics.length + 1}${Date.now()}`, // More uniqueness
        createdAt: now,
        lastActivity: now,
        postCount: 1, // Start with 1 post (the initial one)
    };
    topics.push(newTopic);
    console.log("Created Topic:", newTopic);

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

    return newTopic;
}

// Fetch Posts
export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const topicPosts = posts.filter(p => p.topicId === topicId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  // Add author data
  return Promise.all(topicPosts.map(async post => {
    const author = await findUserById(post.authorId);
    return { ...post, author };
  }));
};

interface CreatePostParams extends Omit<Post, 'id' | 'createdAt' | 'updatedAt'> {
    imageUrl?: string;
}

export const createPost = async (postData: CreatePostParams): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const now = new Date();
    const newPost: Post = {
        content: postData.content,
        topicId: postData.topicId,
        authorId: postData.authorId,
        imageUrl: postData.imageUrl,
        id: `post${posts.length + 1}${Date.now()}`, // More uniqueness
        createdAt: now,
    };
    posts.push(newPost);

    // Update topic's last activity and post count
    const topicIndex = topics.findIndex(t => t.id === postData.topicId);
    if (topicIndex !== -1) {
        topics[topicIndex].lastActivity = now;
        topics[topicIndex].postCount = (topics[topicIndex].postCount || 0) + 1;

         // Update category post count via the topic
        const categoryId = topics[topicIndex].categoryId;
        const catIndex = categories.findIndex(c => c.id === categoryId);
        if (catIndex !== -1) {
            categories[catIndex].postCount = (categories[catIndex].postCount || 0) + 1;
        }
    }

    console.log("Created Post:", newPost);
    // Populate author and topic details for the returned post
    const author = await findUserById(newPost.authorId);
    const topic = await getTopicById(newPost.topicId); // Use existing function
    return { ...newPost, author: author ?? undefined, topic: topic ?? undefined };
};

export const updatePost = async (postId: string, content: string, userId: string, imageUrl?: string | null): Promise<Post | null> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        console.error("Update failed: Post not found.");
        return null;
    }

    const post = posts[postIndex];
    const user = await findUserById(userId);
    const canModify = user?.isAdmin || post.authorId === userId;

    if (!canModify) {
        console.error("Update failed: User not authorized.");
        return null;
    }

    post.content = content;
    if (imageUrl === null) { // Explicitly removing image
        delete post.imageUrl;
    } else if (imageUrl) { // Adding or changing image
        post.imageUrl = imageUrl;
    }
    // If imageUrl is undefined, do nothing to the existing imageUrl

    post.updatedAt = new Date();
    console.log("Updated Post:", post);
    // Populate author and topic details for the returned post
    const author = await findUserById(post.authorId);
    const topic = await getTopicById(post.topicId);
    return { ...post, author: author ?? undefined, topic: topic ?? undefined };
};

export const deletePost = async (postId: string, userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const postIndex = posts.findIndex(p => p.id === postId);
     if (postIndex === -1) {
         console.error("Delete failed: Post not found.");
        return false; // Post not found
    }

    const postToDelete = posts[postIndex];
    const user = await findUserById(userId);
    const canDelete = user?.isAdmin || postToDelete.authorId === userId;

     if (!canDelete) {
         console.error("Delete failed: User not authorized.");
        return false; // User not authorized
    }

    const deletedPost = posts.splice(postIndex, 1)[0];

    // Update topic post count
     const topicIndex = topics.findIndex(t => t.id === deletedPost.topicId);
    if (topicIndex !== -1) {
        const currentTopic = topics[topicIndex];
        currentTopic.postCount = Math.max(0, (currentTopic.postCount || 1) - 1);

        // Update category post count via the topic
        const categoryId = currentTopic.categoryId;
        const catIndex = categories.findIndex(c => c.id === categoryId);
        if (catIndex !== -1) {
            categories[catIndex].postCount = Math.max(0, (categories[catIndex].postCount || 1) - 1);
        }

        // Optional: Decide if topic should be deleted if empty
        // if (topics[topicIndex].postCount === 0) {
        //     topics.splice(topicIndex, 1);
        //      if (catIndex !== -1) { // Update category topic count if topic is deleted
        //          categories[catIndex].topicCount = Math.max(0, (categories[catIndex].topicCount || 1) - 1);
        //      }
        // }
    }


    console.log("Deleted Post ID:", postId);
     revalidatePath(`/topics/${deletedPost.topicId}`); // Revalidate topic page
     revalidatePath('/admin'); // Revalidate admin dashboard counts
     // May need to revalidate category page too if counts are shown there
     if(topicIndex !== -1 && topics[topicIndex]) revalidatePath(`/categories/${topics[topicIndex].categoryId}`);
    return true;
};

export const getSimulatedUser = async (): Promise<User | null> => {
   // Return null as there are no users initially after reset
   return null;
}

// --- Count Functions for Admin Dashboard ---
export const getTotalUserCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    return users.length;
};

export const getTotalCategoryCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    return categories.length;
};

export const getTotalTopicCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    return topics.length;
};

export const getTotalPostCount = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    return posts.length;
};

// Ensure this file doesn't end prematurely
// This comment prevents accidental truncation issues if the file ends with code.
