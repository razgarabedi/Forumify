import type { User, Category, Topic, Post } from './types';

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
    isAdmin?: boolean;
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
    isAdmin: userData.isAdmin ?? false,
    id: `user${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
    createdAt: new Date(),
  };
  users.push(newUser);
  console.log("Created User:", newUser.id, newUser.username); // Log new user details
  console.log("Current Users:", users.map(u => ({ id: u.id, username: u.username, email: u.email }))); // Log current state of users array
  return newUser;
};

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
        id: `cat${categories.length + 1}`,
        createdAt: new Date(),
        topicCount: 0,
        postCount: 0,
    };
    categories.push(newCategory);
    console.log("Created Category:", newCategory);
    return newCategory;
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

export const createTopic = async (topicData: Omit<Topic, 'id' | 'createdAt' | 'lastActivity' | 'postCount'>): Promise<Topic> => {
    await new Promise(resolve => setTimeout(resolve, 250));
    const now = new Date();
    const newTopic: Topic = {
        ...topicData,
        id: `topic${topics.length + 1}`,
        createdAt: now,
        lastActivity: now,
        postCount: 1, // Start with 1 post (the initial one)
    };
    topics.push(newTopic);
    console.log("Created Topic:", newTopic);

    // Automatically create the first post for the topic
    await createPost({
        content: "Initial post content.", // Default initial content
        topicId: newTopic.id,
        authorId: topicData.authorId,
    });

    // Update category topic count
    const catIndex = categories.findIndex(c => c.id === topicData.categoryId);
     if (catIndex !== -1) {
        categories[catIndex].topicCount = (categories[catIndex].topicCount || 0) + 1;
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

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const now = new Date();
    const newPost: Post = {
        ...postData,
        id: `post${posts.length + 1}`,
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

export const updatePost = async (postId: string, content: string, userId: string): Promise<Post | null> => {
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
    return true;
};

export const getSimulatedUser = async (): Promise<User | null> => {
   // Return null as there are no users initially after reset
   return null;
}
