
// src/lib/db.ts
import { Pool } from 'pg';
import type { User, Category, Topic, Post, Notification, Conversation, PrivateMessage, Reaction, ReactionType, CategoryLastPostInfo } from './types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

let pool: Pool | undefined = undefined;

if (process.env.DATABASE_URL) {
  if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.error('CRITICAL: DATABASE_URL is not a valid PostgreSQL connection string. It should start with "postgresql://". Database operations will be disabled.');
  } else {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Add SSL configuration for production if needed, e.g.
        // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      });
      console.log("Database pool configured using DATABASE_URL.");
      // Optionally, test the connection here, but be mindful of startup performance.
      // pool.query('SELECT 1').then(() => console.log('Database connection test successful.')).catch(e => console.error('Database connection test failed:', e));
    } catch (e: any) {
      console.error(`CRITICAL: Error initializing database pool with DATABASE_URL. Check if the URL is correct and the database server is accessible. Error: ${e.message}`);
      // pool remains undefined
    }
  }
} else {
  console.warn('CRITICAL: DATABASE_URL environment variable is not set. Database operations will be disabled. Please set this variable for the application to function correctly.');
  // pool remains undefined
}


// Export a query function
export const query = (text: string, params?: any[]) => {
  if (!pool) {
    console.error("Database query attempted but pool is not initialized. DATABASE_URL might be missing or invalid. Check server logs.");
    throw new Error('Database service is unavailable. Ensure DATABASE_URL is correctly set and the database is running.');
  }
  return pool.query(text, params);
};

// --- Points Calculation ---
// This would ideally be a more optimized query or trigger in a real DB.
// For now, we'll query reactions and sum points based on type.
export const calculateUserPoints = async (userId: string): Promise<number> => {
    try {
        // Calculate points from reactions on user's posts, where reactor is not the author
        const reactionPointsRes = await query(
            `SELECT r.type
             FROM reactions r
             JOIN posts p ON r.post_id = p.id
             WHERE p.author_id = $1 AND r.user_id != p.author_id`,
            [userId]
        );

        let totalPoints = 0;
        for (const row of reactionPointsRes.rows) {
            switch (row.type as ReactionType) {
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
        
        // Update the user's points in the database
        await query('UPDATE users SET points = $1 WHERE id = $2', [totalPoints, userId]);
        return totalPoints;
    } catch (error) {
        console.error(`Error calculating points for user ${userId}:`, error);
        return 0; // Return 0 or throw, depending on desired error handling
    }
};


// --- User Functions ---
export const getAllUsers = async (): Promise<User[]> => {
  const result = await query('SELECT id, username, email, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points FROM users ORDER BY created_at DESC');
  return Promise.all(result.rows.map(async (row: any) => ({
    ...row,
    postCount: await getUserPostCount(row.id),
    // points: await calculateUserPoints(row.id) // Points are now a direct column
  })));
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) return null;
  const user = result.rows[0];
  // In a real app, password_hash would be 'password' from placeholder if not hashed
  return { ...user, password: user.password_hash, postCount: await getUserPostCount(user.id) };
};

export const findUserById = async (id: string): Promise<User | null> => {
  const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points FROM users WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  const user = result.rows[0];
  return { ...user, password: user.password_hash, postCount: await getUserPostCount(user.id) };
};

export const findUserByUsername = async (username: string): Promise<User | null> => {
  const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points FROM users WHERE lower(username) = lower($1)', [username]);
  if (result.rows.length === 0) return null;
  const user = result.rows[0];
  return { ...user, password: user.password_hash, postCount: await getUserPostCount(user.id) };
};

interface CreateUserParams {
    username: string;
    email: string;
    password?: string; // This will be the plain password to be hashed
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
  const userId = uuidv4();
  const now = new Date();
  // TODO: Implement password hashing (e.g., using bcrypt)
  // const hashedPassword = await bcrypt.hash(userData.password, 10);
  const passwordHash = userData.password; // Storing plain for now, as in placeholder

  const result = await query(
    'INSERT INTO users (id, username, email, password_hash, is_admin, created_at, last_active, about_me, location, website_url, social_media_url, signature, avatar_url, points) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    [
      userId,
      userData.username,
      userData.email,
      passwordHash,
      userData.isAdmin ?? false,
      now,
      userData.lastActive || now,
      userData.aboutMe || `Hello, I'm ${userData.username}!`,
      userData.location,
      userData.websiteUrl,
      userData.socialMediaUrl,
      userData.signature || `Regards, ${userData.username}`,
      userData.avatarUrl || `https://avatar.vercel.sh/${userData.username}.png?size=128`,
      0 // Initial points
    ]
  );
  const newUser = result.rows[0];
  return { ...newUser, password: newUser.password_hash, postCount: 0, points: newUser.points };
};

export const updateUserProfile = async (userId: string, profileData: Partial<Omit<User, 'id' | 'email' | 'password' | 'isAdmin' | 'createdAt' | 'postCount' | 'points'>>): Promise<User | null> => {
  const { aboutMe, location, websiteUrl, socialMediaUrl, signature, avatarUrl } = profileData;
  const result = await query(
    'UPDATE users SET about_me = COALESCE($1, about_me), location = COALESCE($2, location), website_url = COALESCE($3, website_url), social_media_url = COALESCE($4, social_media_url), signature = COALESCE($5, signature), avatar_url = COALESCE($6, avatar_url), last_active = NOW() WHERE id = $7 RETURNING *',
    [aboutMe, location, websiteUrl, socialMediaUrl, signature, avatarUrl, userId]
  );
  if (result.rows.length === 0) return null;
  const updatedUser = result.rows[0];
  return { ...updatedUser, password: updatedUser.password_hash, postCount: await getUserPostCount(userId), points: updatedUser.points };
};

export const updateUserLastActive = async (userId: string): Promise<void> => {
  await query('UPDATE users SET last_active = NOW() WHERE id = $1', [userId]);
};

export const updateUserPassword = async (userId: string, currentPasswordPlain: string, newPasswordPlain: string): Promise<{success: boolean, message?: string}> => {
  const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    return { success: false, message: "User not found." };
  }
  // TODO: Compare hashed currentPasswordPlain with stored password_hash
  if (userResult.rows[0].password_hash !== currentPasswordPlain) { // Placeholder comparison
    return { success: false, message: "Incorrect current password." };
  }
  // TODO: Hash newPasswordPlain before storing
  const newPasswordHash = newPasswordPlain; // Placeholder
  await query('UPDATE users SET password_hash = $1, last_active = NOW() WHERE id = $2', [newPasswordHash, userId]);
  return { success: true };
};

export const setUserAdminStatus = async (userId: string, isAdmin: boolean): Promise<User | null> => {
  const result = await query('UPDATE users SET is_admin = $1, last_active = NOW() WHERE id = $2 RETURNING *', [isAdmin, userId]);
  if (result.rows.length === 0) return null;
  const updatedUser = result.rows[0];
  return { ...updatedUser, password: updatedUser.password_hash, postCount: await getUserPostCount(userId), points: updatedUser.points };
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  // Consider related data: set posts.author_id to NULL, delete notifications, PMs etc.
  const client = await pool.connect(); // Check if pool is defined before connecting
  try {
    await client.query('BEGIN');
    await client.query('UPDATE posts SET author_id = NULL WHERE author_id = $1', [userId]);
    await client.query('DELETE FROM notifications WHERE sender_id = $1 OR recipient_user_id = $1', [userId]);
    // Complex logic for deleting conversations and messages might be needed
    await client.query('DELETE FROM private_messages WHERE sender_id = $1 OR conversation_id IN (SELECT id FROM conversations WHERE $1 = ANY(participant_ids))', [userId]);
    await client.query('DELETE FROM conversations WHERE $1 = ANY(participant_ids)', [userId]);
    await client.query('DELETE FROM reactions WHERE user_id = $1', [userId]);
    const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    return result.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    return false;
  } finally {
    client.release();
  }
};

// --- Category Functions ---
export const getCategories = async (): Promise<Category[]> => {
  const queryText = `
    SELECT 
        c.id, c.name, c.description, c.created_at,
        COUNT(DISTINCT t.id) AS topic_count,
        COUNT(DISTINCT p.id) AS post_count,
        (SELECT row_to_json(lp) FROM (
            SELECT 
                p_last.id,
                p_last.topic_id AS "topicId",
                t_last.title AS "topicTitle",
                u_last.id AS "authorId",
                u_last.username AS "authorUsername",
                u_last.avatar_url AS "authorAvatarUrl",
                p_last.created_at AS "createdAt"
            FROM posts p_last
            JOIN topics t_last ON p_last.topic_id = t_last.id
            JOIN users u_last ON p_last.author_id = u_last.id
            WHERE t_last.category_id = c.id
            ORDER BY p_last.created_at DESC
            LIMIT 1
        ) lp) AS last_post
    FROM categories c
    LEFT JOIN topics t ON c.id = t.category_id
    LEFT JOIN posts p ON t.id = p.topic_id
    GROUP BY c.id, c.name, c.description, c.created_at
    ORDER BY c.created_at ASC;
  `;
  const result = await query(queryText);
  return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
      topicCount: parseInt(row.topic_count, 10),
      postCount: parseInt(row.post_count, 10),
      lastPost: row.last_post ? {
          id: row.last_post.id,
          topicId: row.last_post.topicId,
          topicTitle: row.last_post.topicTitle,
          authorId: row.last_post.authorId,
          authorUsername: row.last_post.authorUsername,
          authorAvatarUrl: row.last_post.authorAvatarUrl,
          createdAt: new Date(row.last_post.createdAt),
      } : null,
  }));
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  const queryText = `
    SELECT 
        c.id, c.name, c.description, c.created_at,
        COUNT(DISTINCT t.id) AS topic_count,
        COUNT(DISTINCT p.id) AS post_count,
        (SELECT row_to_json(lp) FROM (
            SELECT 
                p_last.id,
                p_last.topic_id AS "topicId",
                t_last.title AS "topicTitle",
                u_last.id AS "authorId",
                u_last.username AS "authorUsername",
                u_last.avatar_url AS "authorAvatarUrl",
                p_last.created_at AS "createdAt"
            FROM posts p_last
            JOIN topics t_last ON p_last.topic_id = t_last.id
            JOIN users u_last ON p_last.author_id = u_last.id
            WHERE t_last.category_id = c.id
            ORDER BY p_last.created_at DESC
            LIMIT 1
        ) lp) AS last_post
    FROM categories c
    LEFT JOIN topics t ON c.id = t.category_id
    LEFT JOIN posts p ON t.id = p.topic_id
    WHERE c.id = $1
    GROUP BY c.id, c.name, c.description, c.created_at;
  `;
  const result = await query(queryText, [id]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
      topicCount: parseInt(row.topic_count, 10),
      postCount: parseInt(row.post_count, 10),
      lastPost: row.last_post ? {
          id: row.last_post.id,
          topicId: row.last_post.topicId,
          topicTitle: row.last_post.topicTitle,
          authorId: row.last_post.authorId,
          authorUsername: row.last_post.authorUsername,
          authorAvatarUrl: row.last_post.authorAvatarUrl,
          createdAt: new Date(row.last_post.createdAt),
      } : null,
  };
};

export const createCategory = async (categoryData: Pick<Category, 'name' | 'description'>): Promise<Category> => {
  const categoryId = uuidv4();
  const result = await query(
    'INSERT INTO categories (id, name, description, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [categoryId, categoryData.name, categoryData.description]
  );
  const newCategory = result.rows[0];
  return { ...newCategory, topicCount: 0, postCount: 0, lastPost: null };
};

export const updateCategory = async (categoryId: string, data: { name: string; description?: string }): Promise<Category | null> => {
  const result = await query(
    'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
    [data.name, data.description, categoryId]
  );
  if (result.rows.length === 0) return null;
  // Re-fetch to get accurate counts and lastPost if structure is complex
  return getCategoryById(categoryId);
};

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  // ON DELETE CASCADE for topics and posts should handle related data deletion if schema is set up correctly.
  // Otherwise, manual deletion needed.
  const result = await query('DELETE FROM categories WHERE id = $1', [categoryId]);
  return result.rowCount > 0;
};

// --- Topic Functions ---
export const getTopicsByCategory = async (categoryId: string): Promise<Topic[]> => {
  const result = await query(`
    SELECT t.*, u.username as author_username, u.avatar_url as author_avatar_url, 
           (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) as post_count
    FROM topics t
    JOIN users u ON t.author_id = u.id
    WHERE t.category_id = $1
    ORDER BY t.last_activity DESC
  `, [categoryId]);
  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    authorId: row.author_id,
    createdAt: new Date(row.created_at),
    lastActivity: new Date(row.last_activity),
    postCount: parseInt(row.post_count, 10),
    author: {
        id: row.author_id,
        username: row.author_username,
        avatarUrl: row.author_avatar_url,
        // Fill other required User fields minimally or fetch full user if needed
        email: '', // Placeholder
        createdAt: new Date(), // Placeholder
    }
  }));
};

export const getTopicById = async (id: string): Promise<Topic | null> => {
  const topicRes = await query(`
    SELECT t.*, 
           u.id as author_id_fk, u.username as author_username, u.avatar_url as author_avatar_url, u.email as author_email, u.created_at as author_created_at, u.points as author_points,
           c.id as category_id_fk, c.name as category_name, c.description as category_description, c.created_at as category_created_at,
           (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) as post_count
    FROM topics t
    JOIN users u ON t.author_id = u.id
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = $1
  `, [id]);
  if (topicRes.rows.length === 0) return null;
  const row = topicRes.rows[0];
  return {
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    authorId: row.author_id,
    createdAt: new Date(row.created_at),
    lastActivity: new Date(row.last_activity),
    postCount: parseInt(row.post_count, 10),
    author: {
      id: row.author_id_fk,
      username: row.author_username,
      avatarUrl: row.author_avatar_url,
      email: row.author_email,
      createdAt: new Date(row.author_created_at),
      points: row.author_points,
      postCount: await getUserPostCount(row.author_id_fk),
    },
    category: await getCategoryById(row.category_id_fk) || undefined, // Fetch full category with its counts
  };
};

export const getTopicByIdSimple = async (id: string): Promise<Topic | null> => {
  const result = await query('SELECT * FROM topics WHERE id = $1', [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

interface CreateTopicParamsDB extends Omit<Topic, 'id' | 'createdAt' | 'lastActivity' | 'postCount' | 'author' | 'category'> {
    firstPostContent: string;
    firstPostImageUrl?: string;
}
export const createTopic = async (topicData: CreateTopicParamsDB): Promise<Topic> => {
  if (!pool) throw new Error('Database pool not initialized.'); // Add check
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const now = new Date();
    const topicId = uuidv4();
    const topicRes = await client.query(
      'INSERT INTO topics (id, title, category_id, author_id, created_at, last_activity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [topicId, topicData.title, topicData.categoryId, topicData.authorId, now, now]
    );
    const newTopic = topicRes.rows[0];

    await client.query(
      'INSERT INTO posts (id, content, topic_id, author_id, created_at, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
      [uuidv4(), topicData.firstPostContent, newTopic.id, topicData.authorId, now, topicData.firstPostImageUrl]
    );
    await client.query('COMMIT');
    await updateUserLastActive(topicData.authorId);
    return (await getTopicById(newTopic.id))!; // Fetch with all details
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating topic:', error);
    throw error;
  } finally {
    client.release();
  }
};

// --- Post Functions ---
export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
  const result = await query(`
    SELECT p.*, 
           u.id as author_id_fk, u.username as author_username, u.avatar_url as author_avatar_url, u.email as author_email, u.created_at as author_created_at, u.is_admin as author_is_admin, u.location as author_location, u.points as author_points,
           t.id as topic_id_fk, t.title as topic_title
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN topics t ON p.topic_id = t.id
    WHERE p.topic_id = $1
    ORDER BY p.created_at ASC
  `, [topicId]);

  return Promise.all(result.rows.map(async row => {
    const reactionsRes = await query('SELECT user_id, type, (SELECT username FROM users WHERE id = user_id) as username FROM reactions WHERE post_id = $1', [row.id]);
    const authorPostCount = row.author_id_fk ? await getUserPostCount(row.author_id_fk) : 0;
    return {
      id: row.id,
      content: row.content,
      topicId: row.topic_id,
      authorId: row.author_id,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      imageUrl: row.image_url,
      author: row.author_id_fk ? {
        id: row.author_id_fk,
        username: row.author_username,
        avatarUrl: row.author_avatar_url,
        email: row.author_email,
        createdAt: new Date(row.author_created_at),
        isAdmin: row.author_is_admin,
        location: row.author_location,
        points: row.author_points,
        postCount: authorPostCount,
      } : undefined,
      topic: row.topic_id_fk ? {
        id: row.topic_id_fk,
        title: row.topic_title,
        categoryId: '', // Placeholder, not fetched in this query
        authorId: '', // Placeholder
        createdAt: new Date(), // Placeholder
        lastActivity: new Date(), // Placeholder
      } : undefined,
      reactions: reactionsRes.rows.map(r => ({ userId: r.user_id, username: r.username, type: r.type as ReactionType })),
    };
  }));
};

export const getUserPostCount = async (userId: string): Promise<number> => {
  const result = await query('SELECT COUNT(*) as count FROM posts WHERE author_id = $1', [userId]);
  return parseInt(result.rows[0].count, 10);
};

interface CreatePostParamsDB extends Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'topic' | 'reactions'> {
    imageUrl?: string;
}
export const createPost = async (postData: CreatePostParamsDB): Promise<Post> => {
  if (!pool) throw new Error('Database pool not initialized.'); // Add check
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const now = new Date();
    const postId = uuidv4();
    const postRes = await client.query(
      'INSERT INTO posts (id, content, topic_id, author_id, created_at, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [postId, postData.content, postData.topicId, postData.authorId, now, postData.imageUrl]
    );
    const newPost = postRes.rows[0];

    await client.query('UPDATE topics SET last_activity = $1 WHERE id = $2', [now, postData.topicId]);
    // post_count on topics table would ideally be updated by a trigger or a separate query.
    await client.query('COMMIT');
    await updateUserLastActive(postData.authorId);

    // Fetch full post details for return
    const fullPost = (await getPostsByTopic(newPost.topic_id)).find(p => p.id === newPost.id);
    return fullPost!;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating post:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const updatePost = async (postId: string, content: string, userId: string, imageUrl?: string | null): Promise<Post | null> => {
  if (!pool) throw new Error('Database pool not initialized.'); // Add check
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const postCheck = await client.query('SELECT author_id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) throw new Error("Post not found.");

    const user = await findUserById(userId); // Fetches user with isAdmin status
    if (!user) throw new Error("User not found.");
    const canModify = user.isAdmin || postCheck.rows[0].author_id === userId;
    if (!canModify) throw new Error("User not authorized to update this post.");

    const result = await client.query(
      'UPDATE posts SET content = $1, image_url = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [content, imageUrl, postId] // If imageUrl is null, it will set it to null. If undefined, COALESCE or conditional logic needed if you want to preserve existing image.
                                   // For this implementation, if imageUrl is undefined, it will not change. If null, it will be set to null (removed).
                                   // If imageUrl has a value, it will be updated.
    );
    await client.query('COMMIT');
    await updateUserLastActive(userId);
    if (result.rows.length === 0) return null;
    
    const updatedPostData = result.rows[0];
    const fullPost = (await getPostsByTopic(updatedPostData.topic_id)).find(p => p.id === updatedPostData.id);
    return fullPost || null;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating post:', error);
    throw error; // Or return null
  } finally {
    client.release();
  }
};

export const deletePost = async (postId: string, userId: string, isAdmin: boolean): Promise<boolean> => {
  if (!pool) throw new Error('Database pool not initialized.'); // Add check
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const postCheck = await client.query('SELECT author_id, topic_id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) return false;

    const postToDelete = postCheck.rows[0];
    const canDelete = isAdmin || postToDelete.author_id === userId;
    if (!canDelete) return false;
    
    // Before deleting post, remove related reactions & notifications
    await client.query('DELETE FROM reactions WHERE post_id = $1', [postId]);
    await client.query('DELETE FROM notifications WHERE post_id = $1', [postId]);

    const result = await client.query('DELETE FROM posts WHERE id = $1', [postId]);
    // Update topic's last_activity if this was the last post. This is complex.
    // For simplicity, we might just revalidate.
    await client.query('COMMIT');
    await updateUserLastActive(userId);
    return result.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting post:', error);
    return false;
  } finally {
    client.release();
  }
};

// --- Post Reactions ---
export const togglePostReaction = async (postId: string, userId: string, username: string, reactionType: ReactionType): Promise<Post | null> => {
  if (!pool) throw new Error('Database pool not initialized.'); // Add check
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingReaction = await client.query(
      'SELECT type FROM reactions WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (existingReaction.rows.length > 0) {
      if (existingReaction.rows[0].type === reactionType) {
        await client.query('DELETE FROM reactions WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      } else {
        await client.query('UPDATE reactions SET type = $1, created_at = NOW() WHERE post_id = $2 AND user_id = $3', [reactionType, postId, userId]);
      }
    } else {
      await client.query('INSERT INTO reactions (post_id, user_id, type, created_at) VALUES ($1, $2, $3, NOW())', [postId, userId, reactionType]);
    }
    await client.query('COMMIT');
    await updateUserLastActive(userId);
    
    // Recalculate points for the post author after reaction change
    const postAuthorRes = await client.query('SELECT author_id FROM posts WHERE id = $1', [postId]);
    if (postAuthorRes.rows.length > 0) {
        await calculateUserPoints(postAuthorRes.rows[0].author_id);
    }

    // Return the updated post object
    const updatedPostData = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (updatedPostData.rows.length === 0) return null;
    
    const fullPost = (await getPostsByTopic(updatedPostData.rows[0].topic_id)).find(p => p.id === postId);
    return fullPost || null;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error toggling reaction:', error);
    throw error;
  } finally {
    client.release();
  }
};

// --- Count Functions for Admin Dashboard ---
export const getTotalUserCount = async (): Promise<number> => (await query('SELECT COUNT(*) as count FROM users')).rows[0].count;
export const getTotalCategoryCount = async (): Promise<number> => (await query('SELECT COUNT(*) as count FROM categories')).rows[0].count;
export const getTotalTopicCount = async (): Promise<number> => (await query('SELECT COUNT(*) as count FROM topics')).rows[0].count;
export const getTotalPostCount = async (): Promise<number> => (await query('SELECT COUNT(*) as count FROM posts')).rows[0].count;

// --- Notification Functions ---
export const createNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
  const id = uuidv4();
  const result = await query(
    'INSERT INTO notifications (id, type, recipient_user_id, sender_id, post_id, topic_id, topic_title, conversation_id, reaction_type, created_at, is_read, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), FALSE, $10) RETURNING *',
    [id, data.type, data.recipientUserId, data.senderId, data.postId, data.topicId, data.topicTitle, data.conversationId, data.reactionType, data.message]
  );
  const newNotif = result.rows[0];
  // Map recipient_user_id to recipientUserId etc for consistency with type
  return {
      ...newNotif,
      recipientUserId: newNotif.recipient_user_id,
      senderId: newNotif.sender_id,
      postId: newNotif.post_id,
      topicId: newNotif.topic_id,
      topicTitle: newNotif.topic_title,
      conversationId: newNotif.conversation_id,
      reactionType: newNotif.reaction_type,
      isRead: newNotif.is_read,
      createdAt: new Date(newNotif.created_at),
      // senderUsername is not in the DB table, it's passed for convenience. The action will fetch it if needed or it's passed.
      // For db.ts, we primarily deal with DB columns.
      senderUsername: data.senderUsername,
  };
};

export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
  const result = await query(
    `SELECT n.*, u_sender.username as sender_username 
     FROM notifications n
     JOIN users u_sender ON n.sender_id = u_sender.id
     WHERE n.recipient_user_id = $1 
     ORDER BY n.created_at DESC`,
    [userId]
  );
  return result.rows.map(row => ({
      ...row,
      recipientUserId: row.recipient_user_id,
      senderId: row.sender_id,
      postId: row.post_id,
      topicId: row.topic_id,
      topicTitle: row.topic_title,
      conversationId: row.conversation_id,
      reactionType: row.reaction_type,
      isRead: row.is_read,
      createdAt: new Date(row.created_at),
      senderUsername: row.sender_username,
  }));
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const result = await query('SELECT COUNT(*) as count FROM notifications WHERE recipient_user_id = $1 AND is_read = FALSE', [userId]);
  return parseInt(result.rows[0].count, 10);
};

export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
  const result = await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_user_id = $2', [notificationId, userId]);
  return result.rowCount > 0;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  const result = await query('UPDATE notifications SET is_read = TRUE WHERE recipient_user_id = $1 AND is_read = FALSE', [userId]);
  return result.rowCount > 0; // Returns true if any rows were updated
};

// --- Private Messaging Functions ---
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
  const conversationId = generateConversationId(userId1, userId2, subject);
  let result = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
  if (result.rows.length > 0) {
    return { ...result.rows[0], participantIds: result.rows[0].participant_ids, lastMessageAt: new Date(result.rows[0].last_message_at), createdAt: new Date(result.rows[0].created_at) };
  }
  const now = new Date();
  result = await query(
    'INSERT INTO conversations (id, participant_ids, subject, created_at, last_message_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [conversationId, [userId1, userId2].sort(), subject, now, now]
  );
  return { ...result.rows[0], participantIds: result.rows[0].participant_ids, lastMessageAt: new Date(result.rows[0].last_message_at), createdAt: new Date(result.rows[0].created_at) };
};

export const sendPrivateMessage = async (senderId: string, receiverId: string, content: string, subject?: string): Promise<PrivateMessage> => {
  if (!pool) throw new Error('Database pool not initialized.'); // Add check
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const conversation = await getOrCreateConversation(senderId, receiverId, subject); // Ensure conversation exists
    const now = new Date();
    const messageId = uuidv4();
    const messageRes = await client.query(
      'INSERT INTO private_messages (id, conversation_id, sender_id, content, created_at, read_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [messageId, conversation.id, senderId, content, now, [senderId]]
    );
    const newMessage = messageRes.rows[0];

    await client.query(
      'UPDATE conversations SET last_message_at = $1, last_message_snippet = $2, last_message_sender_id = $3 WHERE id = $4',
      [now, content.substring(0, 50) + (content.length > 50 ? '...' : ''), senderId, conversation.id]
    );
    await client.query('COMMIT');
    await updateUserLastActive(senderId);
    return { ...newMessage, conversationId: newMessage.conversation_id, senderId: newMessage.sender_id, readBy: newMessage.read_by, createdAt: new Date(newMessage.created_at) };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending private message:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
  const result = await query(
    'SELECT * FROM conversations WHERE $1 = ANY(participant_ids) ORDER BY last_message_at DESC',
    [userId]
  );
  return result.rows.map(row => ({ ...row, participantIds: row.participant_ids, lastMessageAt: new Date(row.last_message_at), createdAt: new Date(row.created_at) }));
};

export const getMessagesForConversation = async (conversationId: string, currentUserId: string, markAsRead: boolean = true): Promise<PrivateMessage[]> => {
  const messagesRes = await query(
    'SELECT * FROM private_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  );

  if (markAsRead) {
    await query(
      `UPDATE private_messages 
       SET read_by = array_append(read_by, $1) 
       WHERE conversation_id = $2 AND sender_id != $1 AND NOT ($1 = ANY(read_by))`,
      [currentUserId, conversationId]
    );
  }
  return messagesRes.rows.map(row => ({ ...row, conversationId: row.conversation_id, senderId: row.sender_id, readBy: row.read_by, createdAt: new Date(row.created_at) }));
};

export const getUnreadPrivateMessagesCountForConversation = async (conversationId: string, userId: string): Promise<number> => {
  const result = await query(
    'SELECT COUNT(*) as count FROM private_messages WHERE conversation_id = $1 AND sender_id != $2 AND NOT ($2 = ANY(read_by))',
    [conversationId, userId]
  );
  return parseInt(result.rows[0].count, 10);
};

export const getTotalUnreadPrivateMessagesCountForUser = async (userId: string): Promise<number> => {
  // This could be a more complex query summing unread counts per conversation.
  // For simplicity, fetching all messages for the user and counting.
  const result = await query(
    `SELECT COUNT(DISTINCT pm.id) as count
     FROM private_messages pm
     JOIN conversations c ON pm.conversation_id = c.id
     WHERE $1 = ANY(c.participant_ids) AND pm.sender_id != $1 AND NOT ($1 = ANY(pm.read_by))`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
  const result = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
  return result.rows.length > 0 ? { ...result.rows[0], participantIds: result.rows[0].participant_ids, lastMessageAt: new Date(result.rows[0].last_message_at), createdAt: new Date(result.rows[0].created_at) } : null;
};

// Initialization Logic (e.g., create tables if they don't exist)
// This is a simplified version. In production, use migration tools.
async function initializeDatabase() {
  if (!pool) {
    console.warn("Skipping database schema initialization as the database pool is not available. Check DATABASE_URL.");
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        about_me TEXT,
        location TEXT,
        website_url TEXT,
        social_media_url TEXT,
        signature TEXT,
        last_active TIMESTAMPTZ,
        avatar_url TEXT,
        points INTEGER DEFAULT 0
      );
    `);

    // Categories Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Topics Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);
      CREATE INDEX IF NOT EXISTS idx_topics_author_id ON topics(author_id);
    `);

    // Posts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ,
        image_url TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id);
      CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
    `);
    
    // Reactions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY, -- Auto-incrementing integer for easier referencing if needed
        post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL, -- 'like', 'love', etc.
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (post_id, user_id) -- A user can only have one reaction per post
      );
      CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
      CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
    `);

    // Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'mention', 'private_message', 'reaction'
        recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
        topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
        topic_title TEXT,
        conversation_id TEXT, -- Can be NULL if not a PM notification
        reaction_type TEXT, -- Can be NULL if not a reaction notification
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        message TEXT -- For PM snippets or other contextual info
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id);
    `);

    // Conversations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY, -- e.g., conv-userA__userB--s-subject
        participant_ids TEXT[] NOT NULL, -- Array of user IDs
        subject TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_message_snippet TEXT,
        last_message_sender_id TEXT REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids ON conversations USING GIN (participant_ids);
    `);

    // Private Messages Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS private_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        read_by TEXT[] DEFAULT '{}' -- Array of user IDs who have read this message
      );
      CREATE INDEX IF NOT EXISTS idx_private_messages_conversation_id ON private_messages(conversation_id);
    `);

    await client.query('COMMIT');
    console.log("Database tables checked/created successfully.");

    // Add some default data if tables were just created and are empty (optional)
    const usersCountRes = await client.query('SELECT COUNT(*) FROM users');
    const usersCount = parseInt(usersCountRes.rows[0].count, 10);
    
    if (usersCount === 0) {
        console.log("No users found, creating initial admin user...");
        const adminUserData = await createUser({
            username: "admin",
            email: "admin@forumlite.com",
            password: "password123", // TODO: Use a strong, hashed password
            isAdmin: true,
            lastActive: new Date(),
            aboutMe: "Default administrator account.",
        });
        const generalCat = await createCategory({name: 'General Discussion', description: 'Talk about anything.'});
        await createCategory({name: 'Introductions', description: 'Introduce yourself to the community.'});
        const techCat = await createCategory({name: 'Technical Help', description: 'Get help with technical issues.'});
        
        if (adminUserData) { // Ensure adminUser was created
            await createTopic({
                title: "Welcome to ForumLite!",
                categoryId: generalCat.id,
                authorId: adminUserData.id,
                firstPostContent: "This is the first topic on ForumLite. Feel free to look around and start discussions!"
            });
            await createTopic({
                title: "Having trouble with your PC?",
                categoryId: techCat.id,
                authorId: adminUserData.id,
                firstPostContent: "Post your technical issues here and the community might be able to help."
            });
        }
    }

  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Error initializing database:", e);
    // Optionally rethrow or handle
  } finally {
    client.release();
  }
}

// Call initialization once when the module loads
// Ensure pool is defined before calling initializeDatabase
if (pool) {
    initializeDatabase().catch(e => console.error("Failed to initialize database on module load:", e));
} else {
    console.warn("Skipping database initialization as DATABASE_URL is not set or pool failed to initialize.");
}

    
