import type { User, Category, Topic, Post } from './types';

// Placeholder Users
let users: User[] = [
  { id: 'user1', username: 'AdminUser', email: 'admin@example.com', isAdmin: true, createdAt: new Date('2023-01-01T10:00:00Z') },
  { id: 'user2', username: 'RegularJoe', email: 'joe@example.com', createdAt: new Date('2023-01-02T11:00:00Z') },
  { id: 'user3', username: 'JaneDoe', email: 'jane@example.com', createdAt: new Date('2023-01-03T12:00:00Z') },
];

// Placeholder Categories
let categories: Category[] = [
  { id: 'cat1', name: 'General Discussion', description: 'Talk about anything.', createdAt: new Date('2023-01-10T09:00:00Z'), topicCount: 2, postCount: 5 },
  { id: 'cat2', name: 'Introductions', description: 'Introduce yourself to the community.', createdAt: new Date('2023-01-10T09:05:00Z'), topicCount: 1, postCount: 2 },
  { id: 'cat3', name: 'Technical Help', description: 'Get help with technical issues.', createdAt: new Date('2023-01-11T14:00:00Z'), topicCount: 0, postCount: 0 },
];

// Placeholder Topics
let topics: Topic[] = [
  { id: 'topic1', title: 'Welcome to the Forum!', categoryId: 'cat1', authorId: 'user1', createdAt: new Date('2023-01-15T10:00:00Z'), lastActivity: new Date('2023-01-16T15:30:00Z'), postCount: 3 },
  { id: 'topic2', title: 'Favorite Hobbies?', categoryId: 'cat1', authorId: 'user2', createdAt: new Date('2023-01-16T11:00:00Z'), lastActivity: new Date('2023-01-17T08:45:00Z'), postCount: 2 },
  { id: 'topic3', title: 'Hi, I\'m Jane!', categoryId: 'cat2', authorId: 'user3', createdAt: new Date('2023-01-17T12:00:00Z'), lastActivity: new Date('2023-01-17T12:15:00Z'), postCount: 2 },
];

// Placeholder Posts
let posts: Post[] = [
  { id: 'post1', content: 'Welcome everyone! Feel free to post.', topicId: 'topic1', authorId: 'user1', createdAt: new Date('2023-01-15T10:00:00Z') },
  { id: 'post2', content: 'Glad to be here!', topicId: 'topic1', authorId: 'user2', createdAt: new Date('2023-01-15T11:30:00Z') },
  { id: 'post3', content: 'Thanks for the welcome!', topicId: 'topic1', authorId: 'user3', createdAt: new Date('2023-01-16T15:30:00Z') },
  { id: 'post4', content: 'I enjoy hiking and coding.', topicId: 'topic2', authorId: 'user2', createdAt: new Date('2023-01-16T11:00:00Z') },
  { id: 'post5', content: 'Cool! I like reading and gaming.', topicId: 'topic2', authorId: 'user3', createdAt: new Date('2023-01-17T08:45:00Z') },
  { id: 'post6', content: 'Hello! Just joined the forum.', topicId: 'topic3', authorId: 'user3', createdAt: new Date('2023-01-17T12:00:00Z') },
  { id: 'post7', content: 'Welcome Jane!', topicId: 'topic3', authorId: 'user1', createdAt: new Date('2023-01-17T12:15:00Z') },
];

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

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const newUser: User = {
    ...userData,
    id: `user${users.length + 1}`,
    createdAt: new Date(),
  };
  users.push(newUser);
  console.log("Created User:", newUser);
  return newUser;
};

// Fetch Categories
export const getCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 150));
   // Simulate adding author data
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
  // Simulate adding author data
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
        content: "Initial post.", // Placeholder, ideally comes from the form
        topicId: newTopic.id,
        authorId: topicData.authorId,
    });
    return newTopic;
}

// Fetch Posts
export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const topicPosts = posts.filter(p => p.topicId === topicId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  // Simulate adding author data
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
    // Update topic's last activity
    const topicIndex = topics.findIndex(t => t.id === postData.topicId);
    if (topicIndex !== -1) {
        topics[topicIndex].lastActivity = now;
        topics[topicIndex].postCount = (topics[topicIndex].postCount || 0) + 1;
    }
     // Update category post count
    const categoryId = topics[topicIndex]?.categoryId;
    if (categoryId) {
        const catIndex = categories.findIndex(c => c.id === categoryId);
        if (catIndex !== -1) {
            categories[catIndex].postCount = (categories[catIndex].postCount || 0) + 1;
        }
    }
    console.log("Created Post:", newPost);
    return newPost;
};

export const updatePost = async (postId: string, content: string, userId: string): Promise<Post | null> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1 || posts[postIndex].authorId !== userId) {
        console.error("Update failed: Post not found or user not authorized.");
        return null; // Post not found or user not authorized
    }
    posts[postIndex].content = content;
    posts[postIndex].updatedAt = new Date();
    console.log("Updated Post:", posts[postIndex]);
    return posts[postIndex];
};

export const deletePost = async (postId: string, userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1 || posts[postIndex].authorId !== userId) {
         console.error("Delete failed: Post not found or user not authorized.");
        return false; // Post not found or user not authorized
    }

    const deletedPost = posts.splice(postIndex, 1)[0];

    // Update topic post count
     const topicIndex = topics.findIndex(t => t.id === deletedPost.topicId);
    if (topicIndex !== -1) {
        topics[topicIndex].postCount = Math.max(0, (topics[topicIndex].postCount || 1) - 1);
        // Optional: Delete topic if it has no posts left? Decide on this logic.
        // if (topics[topicIndex].postCount === 0) {
        //     topics.splice(topicIndex, 1);
        // }
    }

    // Update category post count
    const categoryId = topics[topicIndex]?.categoryId;
    if (categoryId) {
        const catIndex = categories.findIndex(c => c.id === categoryId);
        if (catIndex !== -1) {
            categories[catIndex].postCount = Math.max(0, (categories[catIndex].postCount || 1) - 1);
        }
    }

    console.log("Deleted Post ID:", postId);
    return true;
};


// --- Simple Session Simulation ---
let currentUserId: string | null = null; // Simulate logged-in user

export const getCurrentUserId = async (): Promise<string | null> => {
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async check
    return currentUserId;
}

export const setCurrentUserId = (userId: string | null): void => {
    currentUserId = userId;
}

export const getSimulatedUser = async (): Promise<User | null> => {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    return findUserById(userId);
}
