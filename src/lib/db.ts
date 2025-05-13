// src/lib/db.ts
import { Pool } from 'pg';
import type { User, Category, Topic, Post, Notification, Conversation, PrivateMessage, Reaction, ReactionType, CategoryLastPostInfo } from './types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import * as placeholder from './placeholder-data'; // Import placeholder data functions

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
    } catch (e: any) {
      console.error(`CRITICAL: Error initializing database pool with DATABASE_URL. Check if the URL is correct and the database server is accessible. Error: ${e.message}`);
      pool = undefined; // Ensure pool is undefined if initialization fails
    }
  }
} else {
  console.warn('CRITICAL: DATABASE_URL environment variable is not set. Database operations will be disabled. Placeholder data will be used if available.');
  pool = undefined;
}

// Helper to check database availability
const isDbAvailable = (): boolean => !!pool;

// Export a query function
export const query = (text: string, params?: any[]) => {
  if (!pool) {
    console.error("CRITICAL: Database query attempted but the connection pool is not initialized. This usually means the DATABASE_URL is missing, invalid, or the database server is not accessible. Please check server logs for earlier messages regarding DATABASE_URL configuration and ensure your database is running and configured correctly as per README.md.");
    throw new Error('Database service is unavailable. Ensure DATABASE_URL is correctly set and the database is running.');
  }
  return pool.query(text, params);
};

// --- Points Calculation ---
export const calculateUserPoints = async (userId: string): Promise<number> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] calculateUserPoints for user ${userId}: Database pool not available. Using placeholder data.`);
        return placeholder.calculateUserPoints(userId);
    }
    try {
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
        await query('UPDATE users SET points = $1 WHERE id = $2', [totalPoints, userId]);
        return totalPoints;
    } catch (error: any) {
        console.error(`[DB Error] calculateUserPoints for user ${userId}: Error querying database. Falling back to placeholder.`, error.message);
        return placeholder.calculateUserPoints(userId);
    }
};


// --- User Functions ---
// NOTE: This fallback pattern should be applied to all data access functions in this file.
// The following are examples.

export const getAllUsers = async (): Promise<User[]> => {
  if (!isDbAvailable()) {
    console.warn("[DB Fallback] getAllUsers: Database pool not available. Using placeholder data.");
    return placeholder.getAllUsers();
  }
  try {
    const result = await query('SELECT id, username, email, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points FROM users ORDER BY created_at DESC');
    return Promise.all(result.rows.map(async (row: any) => ({
      ...row,
      postCount: await getUserPostCount(row.id), // This also needs fallback if it queries
    })));
  } catch (error: any) {
    console.error("[DB Error] getAllUsers: Error querying database. Falling back to placeholder data.", error.message);
    return placeholder.getAllUsers();
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  if (!isDbAvailable()) {
    console.warn(`[DB Fallback] findUserByEmail for ${email}: Database pool not available. Using placeholder data.`);
    return placeholder.findUserByEmail(email);
  }
  try {
    const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;
    const user = result.rows[0];
    return { ...user, password: user.password_hash, postCount: await getUserPostCount(user.id), points: user.points };
  } catch (error: any) {
    console.error(`[DB Error] findUserByEmail for ${email}: Error querying database. Falling back to placeholder data.`, error.message);
    return placeholder.findUserByEmail(email);
  }
};

export const findUserById = async (id: string): Promise<User | null> => {
  if (!isDbAvailable()) {
    console.warn(`[DB Fallback] findUserById for ${id}: Database pool not available. Using placeholder data.`);
    return placeholder.findUserById(id);
  }
  try {
    const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const user = result.rows[0];
    return { ...user, password: user.password_hash, postCount: await getUserPostCount(user.id), points: user.points };
  } catch (error: any) {
    console.error(`[DB Error] findUserById for ${id}: Error querying database. Falling back to placeholder data.`, error.message);
    return placeholder.findUserById(id);
  }
};

export const findUserByUsername = async (username: string): Promise<User | null> => {
  if (!isDbAvailable()) {
    console.warn(`[DB Fallback] findUserByUsername for ${username}: Database pool not available. Using placeholder data.`);
    return placeholder.findUserByUsername(username);
  }
  try {
    const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points FROM users WHERE lower(username) = lower($1)', [username]);
    if (result.rows.length === 0) return null;
    const user = result.rows[0];
    return { ...user, password: user.password_hash, postCount: await getUserPostCount(user.id), points: user.points };
  } catch (error: any) {
    console.error(`[DB Error] findUserByUsername for ${username}: Error querying database. Falling back to placeholder data.`, error.message);
    return placeholder.findUserByUsername(username);
  }
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
  if (!isDbAvailable()) {
    console.warn("[DB Fallback] createUser: Database pool not available. Using placeholder data.");
    return placeholder.createUser(userData); // Assuming placeholder.createUser has similar signature
  }
  try {
    const userId = uuidv4();
    const now = new Date();
    const passwordHash = userData.password; 

    const result = await query(
      'INSERT INTO users (id, username, email, password_hash, is_admin, created_at, last_active, about_me, location, website_url, social_media_url, signature, avatar_url, points) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [
        userId, userData.username, userData.email, passwordHash, userData.isAdmin ?? false,
        now, userData.lastActive || now, userData.aboutMe || `Hello, I'm ${userData.username}!`,
        userData.location, userData.websiteUrl, userData.socialMediaUrl,
        userData.signature || `Regards, ${userData.username}`,
        userData.avatarUrl || `https://avatar.vercel.sh/${userData.username}.png?size=128`, 0
      ]
    );
    const newUser = result.rows[0];
    return { ...newUser, password: newUser.password_hash, postCount: 0, points: newUser.points };
  } catch (error: any) {
    console.error("[DB Error] createUser: Error querying database. Falling back to placeholder data (if applicable).", error.message);
    // Fallback for createUser might not be meaningful if DB is expected for new users.
    // Consider if placeholder.createUser should just log or if it actually adds to an in-memory array.
    return placeholder.createUser(userData); 
  }
};

export const updateUserProfile = async (userId: string, profileData: Partial<Omit<User, 'id' | 'email' | 'password' | 'isAdmin' | 'createdAt' | 'postCount' | 'points'>>): Promise<User | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] updateUserProfile for ${userId}: Database pool not available. Using placeholder data.`);
        return placeholder.updateUserProfile(userId, profileData);
    }
    try {
        const { aboutMe, location, websiteUrl, socialMediaUrl, signature, avatarUrl } = profileData;
        const result = await query(
            'UPDATE users SET about_me = COALESCE($1, about_me), location = COALESCE($2, location), website_url = COALESCE($3, website_url), social_media_url = COALESCE($4, social_media_url), signature = COALESCE($5, signature), avatar_url = COALESCE($6, avatar_url), last_active = NOW() WHERE id = $7 RETURNING *',
            [aboutMe, location, websiteUrl, socialMediaUrl, signature, avatarUrl, userId]
        );
        if (result.rows.length === 0) return null;
        const updatedUser = result.rows[0];
        return { ...updatedUser, password: updatedUser.password_hash, postCount: await getUserPostCount(userId), points: updatedUser.points };
    } catch (error: any) {
        console.error(`[DB Error] updateUserProfile for ${userId}: Error querying database. Falling back to placeholder data.`, error.message);
        return placeholder.updateUserProfile(userId, profileData);
    }
};

export const updateUserLastActive = async (userId: string): Promise<void> => {
    if (!isDbAvailable()) {
        // console.warn(`[DB Fallback] updateUserLastActive for ${userId}: Database pool not available. Using placeholder behavior.`);
        return placeholder.updateUserLastActive(userId); // Placeholder might do nothing or update in-memory
    }
    try {
        await query('UPDATE users SET last_active = NOW() WHERE id = $1', [userId]);
    } catch (error: any) {
        console.error(`[DB Error] updateUserLastActive for ${userId}: Error querying database. Placeholder behavior will be used.`, error.message);
        return placeholder.updateUserLastActive(userId);
    }
};

export const updateUserPassword = async (userId: string, currentPasswordPlain: string, newPasswordPlain: string): Promise<{success: boolean, message?: string}> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] updateUserPassword for ${userId}: Database pool not available. Using placeholder data.`);
        return placeholder.updateUserPassword(userId, currentPasswordPlain, newPasswordPlain);
    }
    try {
        const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return { success: false, message: "User not found." };
        }
        if (userResult.rows[0].password_hash !== currentPasswordPlain) {
            return { success: false, message: "Incorrect current password." };
        }
        const newPasswordHash = newPasswordPlain;
        await query('UPDATE users SET password_hash = $1, last_active = NOW() WHERE id = $2', [newPasswordHash, userId]);
        return { success: true };
    } catch (error: any) {
        console.error(`[DB Error] updateUserPassword for ${userId}: Error querying database. Falling back to placeholder.`, error.message);
        return placeholder.updateUserPassword(userId, currentPasswordPlain, newPasswordPlain);
    }
};

export const setUserAdminStatus = async (userId: string, isAdmin: boolean): Promise<User | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] setUserAdminStatus for ${userId}: Database pool not available. Using placeholder data.`);
        return placeholder.setUserAdminStatus(userId, isAdmin);
    }
    try {
        const result = await query('UPDATE users SET is_admin = $1, last_active = NOW() WHERE id = $2 RETURNING *', [isAdmin, userId]);
        if (result.rows.length === 0) return null;
        const updatedUser = result.rows[0];
        return { ...updatedUser, password: updatedUser.password_hash, postCount: await getUserPostCount(userId), points: updatedUser.points };
    } catch (error: any) {
        console.error(`[DB Error] setUserAdminStatus for ${userId}: Error querying database. Falling back to placeholder.`, error.message);
        return placeholder.setUserAdminStatus(userId, isAdmin);
    }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] deleteUser ${userId}: Database pool not available. Using placeholder data.`);
        return placeholder.deleteUser(userId);
    }
    if (!pool) throw new Error('Database pool not initialized.');
    const client = await pool.connect(); 
    try {
        await client.query('BEGIN');
        // Cascade deletes should handle related data if schema is set up correctly.
        // Manually handling some dependencies for robustness:
        await client.query('UPDATE posts SET author_id = NULL WHERE author_id = $1', [userId]);
        await client.query('UPDATE topics SET author_id = NULL WHERE author_id = $1', [userId]);
        await client.query('DELETE FROM notifications WHERE sender_id = $1 OR recipient_user_id = $1', [userId]);
        await client.query('DELETE FROM private_messages WHERE sender_id = $1 OR conversation_id IN (SELECT id FROM conversations WHERE $1 = ANY(participant_ids))', [userId]);
        await client.query('DELETE FROM reactions WHERE user_id = $1', [userId]);
        
        // Fetch conversations to update participant_ids or delete if only one participant remains (or none)
        const userConversations = await client.query('SELECT id, participant_ids FROM conversations WHERE $1 = ANY(participant_ids)', [userId]);
        for (const convo of userConversations.rows) {
            const remainingParticipants = convo.participant_ids.filter((pId: string) => pId !== userId);
            if (remainingParticipants.length < 2) { // If 0 or 1 participant left, delete conversation
                await client.query('DELETE FROM private_messages WHERE conversation_id = $1', [convo.id]);
                await client.query('DELETE FROM conversations WHERE id = $1', [convo.id]);
            } else {
                await client.query('UPDATE conversations SET participant_ids = $1 WHERE id = $2', [remainingParticipants, convo.id]);
            }
        }

        const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
        await client.query('COMMIT');
        return result.rowCount > 0;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[DB Error] Error deleting user:', error);
        // Fallback to placeholder delete if DB operation fails
        return placeholder.deleteUser(userId);
    } finally {
        client.release();
    }
};

// --- Category Functions ---
export const getCategories = async (): Promise<Category[]> => {
  if (!isDbAvailable()) {
    console.warn("[DB Fallback] getCategories: Database pool not available. Using placeholder data.");
    return placeholder.getCategories();
  }
  try {
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
        id: row.id, name: row.name, description: row.description, createdAt: new Date(row.created_at),
        topicCount: parseInt(row.topic_count, 10), postCount: parseInt(row.post_count, 10),
        lastPost: row.last_post ? { ...row.last_post, createdAt: new Date(row.last_post.createdAt) } : null,
    }));
  } catch (error: any) {
    console.error("[DB Error] getCategories: Error querying database. Falling back to placeholder data.", error.message);
    return placeholder.getCategories();
  }
};
// ... (Apply similar fallback pattern to other functions in db.ts) ...
// For brevity, only a few key functions are shown with the full pattern.
// The user should apply this to:
// getCategoryById, createCategory, updateCategory, deleteCategory,
// getTopicsByCategory, getTopicById, getTopicByIdSimple, createTopic,
// getPostsByTopic, getUserPostCount, createPost, updatePost, deletePost,
// togglePostReaction,
// getTotalUserCount, getTotalCategoryCount, getTotalTopicCount, getTotalPostCount,
// createNotification, getNotificationsByUserId, getUnreadNotificationCount,
// markNotificationAsRead, markAllNotificationsAsRead,
// getOrCreateConversation, sendPrivateMessage, getConversationsForUser,
// getMessagesForConversation, getUnreadPrivateMessagesCountForConversation,
// getTotalUnreadPrivateMessagesCountForUser, getConversationById

export const getCategoryById = async (id: string): Promise<Category | null> => {
  if (!isDbAvailable()) {
    console.warn(`[DB Fallback] getCategoryById for ${id}: Database pool not available. Using placeholder data.`);
    return placeholder.getCategoryById(id);
  }
  try {
    const queryText = `
        SELECT 
            c.id, c.name, c.description, c.created_at,
            COUNT(DISTINCT t.id) AS topic_count,
            COUNT(DISTINCT p.id) AS post_count,
            (SELECT row_to_json(lp) FROM (
                SELECT p_last.id, t_last.id AS "topicId", t_last.title AS "topicTitle", u_last.id AS "authorId", u_last.username AS "authorUsername", u_last.avatar_url AS "authorAvatarUrl", p_last.created_at AS "createdAt"
                FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id JOIN users u_last ON p_last.author_id = u_last.id
                WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1
            ) lp) AS last_post
        FROM categories c LEFT JOIN topics t ON c.id = t.category_id LEFT JOIN posts p ON t.id = p.topic_id
        WHERE c.id = $1 GROUP BY c.id, c.name, c.description, c.created_at;`;
    const result = await query(queryText, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
        id: row.id, name: row.name, description: row.description, createdAt: new Date(row.created_at),
        topicCount: parseInt(row.topic_count, 10), postCount: parseInt(row.post_count, 10),
        lastPost: row.last_post ? { ...row.last_post, createdAt: new Date(row.last_post.createdAt) } : null,
    };
  } catch (error: any) {
    console.error(`[DB Error] getCategoryById for ${id}: Error querying database. Falling back to placeholder data.`, error.message);
    return placeholder.getCategoryById(id);
  }
};

export const createCategory = async (categoryData: Pick<Category, 'name' | 'description'>): Promise<Category> => {
  if (!isDbAvailable()) {
    console.warn("[DB Fallback] createCategory: Database pool not available. Using placeholder data.");
    return placeholder.createCategory(categoryData);
  }
  try {
    const categoryId = uuidv4();
    const result = await query(
      'INSERT INTO categories (id, name, description, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [categoryId, categoryData.name, categoryData.description]
    );
    const newCategory = result.rows[0];
    return { ...newCategory, topicCount: 0, postCount: 0, lastPost: null, createdAt: new Date(newCategory.created_at) };
  } catch (error: any) {
    console.error("[DB Error] createCategory: Error querying database. Fallback to placeholder.", error.message);
    return placeholder.createCategory(categoryData);
  }
};

export const updateCategory = async (categoryId: string, data: { name: string; description?: string }): Promise<Category | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] updateCategory for ${categoryId}: Database pool not available. Using placeholder data.`);
        return placeholder.updateCategory(categoryId, data);
    }
    try {
        const result = await query(
            'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [data.name, data.description, categoryId]
        );
        if (result.rows.length === 0) return null;
        return getCategoryById(categoryId); // Re-fetch to get full details with counts
    } catch (error: any) {
        console.error(`[DB Error] updateCategory for ${categoryId}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.updateCategory(categoryId, data);
    }
};

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] deleteCategory ${categoryId}: Database pool not available. Using placeholder data.`);
        return placeholder.deleteCategory(categoryId);
    }
    try {
        const result = await query('DELETE FROM categories WHERE id = $1', [categoryId]);
        return result.rowCount > 0;
    } catch (error: any) {
        console.error(`[DB Error] deleteCategory ${categoryId}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.deleteCategory(categoryId);
    }
};


export const getTopicsByCategory = async (categoryId: string): Promise<Topic[]> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getTopicsByCategory for ${categoryId}: Using placeholder data.`);
        return placeholder.getTopicsByCategory(categoryId);
    }
    try {
        const result = await query(`
            SELECT t.*, u.username as author_username, u.avatar_url as author_avatar_url, 
                   (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) as post_count
            FROM topics t
            LEFT JOIN users u ON t.author_id = u.id
            WHERE t.category_id = $1
            ORDER BY t.last_activity DESC
        `, [categoryId]);
        return result.rows.map(row => ({
            id: row.id, title: row.title, categoryId: row.category_id, authorId: row.author_id,
            createdAt: new Date(row.created_at), lastActivity: new Date(row.last_activity),
            postCount: parseInt(row.post_count, 10),
            author: row.author_id ? { id: row.author_id, username: row.author_username, avatarUrl: row.author_avatar_url, email: '', createdAt: new Date() } : undefined
        }));
    } catch (error: any) {
        console.error(`[DB Error] getTopicsByCategory for ${categoryId}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.getTopicsByCategory(categoryId);
    }
};

export const getTopicById = async (id: string): Promise<Topic | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getTopicById for ${id}: Using placeholder data.`);
        return placeholder.getTopicById(id);
    }
    try {
        const topicRes = await query(`
            SELECT t.*, 
                   u.id as author_id_fk, u.username as author_username, u.avatar_url as author_avatar_url, u.email as author_email, u.created_at as author_created_at, u.points as author_points, u.is_admin as author_is_admin, u.location as author_location,
                   c.id as category_id_fk, c.name as category_name,
                   (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) as post_count
            FROM topics t
            LEFT JOIN users u ON t.author_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1
        `, [id]);
        if (topicRes.rows.length === 0) return null;
        const row = topicRes.rows[0];
        const authorPostCount = row.author_id_fk ? await getUserPostCount(row.author_id_fk) : 0;
        return {
            id: row.id, title: row.title, categoryId: row.category_id, authorId: row.author_id,
            createdAt: new Date(row.created_at), lastActivity: new Date(row.last_activity),
            postCount: parseInt(row.post_count, 10),
            author: row.author_id_fk ? {
                id: row.author_id_fk, username: row.author_username, avatarUrl: row.author_avatar_url, email: row.author_email, createdAt: new Date(row.author_created_at), points: row.author_points, postCount: authorPostCount, isAdmin: row.author_is_admin, location: row.author_location,
            } : undefined,
            category: row.category_id_fk ? await getCategoryById(row.category_id_fk) : undefined,
        };
    } catch (error: any) {
        console.error(`[DB Error] getTopicById for ${id}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.getTopicById(id);
    }
};

export const getTopicByIdSimple = async (id: string): Promise<Topic | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getTopicByIdSimple for ${id}: Using placeholder data.`);
        return placeholder.getTopicByIdSimple(id);
    }
    try {
        const result = await query('SELECT * FROM topics WHERE id = $1', [id]);
        return result.rows.length > 0 ? { ...result.rows[0], createdAt: new Date(result.rows[0].created_at), lastActivity: new Date(result.rows[0].last_activity) } : null;
    } catch (error: any) {
        console.error(`[DB Error] getTopicByIdSimple for ${id}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.getTopicByIdSimple(id);
    }
};

interface CreateTopicParamsDB extends Omit<Topic, 'id' | 'createdAt' | 'lastActivity' | 'postCount' | 'author' | 'category'> {
    firstPostContent: string;
    firstPostImageUrl?: string;
}
export const createTopic = async (topicData: CreateTopicParamsDB): Promise<Topic> => {
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] createTopic: Using placeholder data.");
        return placeholder.createTopic(topicData);
    }
    if (!pool) throw new Error('Database pool not initialized.');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const now = new Date();
        const topicId = uuidv4();
        const topicRes = await client.query(
            'INSERT INTO topics (id, title, category_id, author_id, created_at, last_activity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [topicId, topicData.title, topicData.categoryId, topicData.authorId, now, now]
        );
        const newTopicDb = topicRes.rows[0];

        await client.query(
            'INSERT INTO posts (id, content, topic_id, author_id, created_at, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuidv4(), topicData.firstPostContent, newTopicDb.id, topicData.authorId, now, topicData.firstPostImageUrl]
        );
        await client.query('COMMIT');
        await updateUserLastActive(topicData.authorId);
        const fullTopic = await getTopicById(newTopicDb.id); // Fetch with all details
        return fullTopic!;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('[DB Error] createTopic: Error creating topic. Fallback to placeholder.', error.message);
        return placeholder.createTopic(topicData);
    } finally {
        client.release();
    }
};

export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getPostsByTopic for ${topicId}: Using placeholder data.`);
        return placeholder.getPostsByTopic(topicId);
    }
    try {
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
                id: row.id, content: row.content, topicId: row.topic_id, authorId: row.author_id,
                createdAt: new Date(row.created_at), updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
                imageUrl: row.image_url,
                author: row.author_id_fk ? {
                    id: row.author_id_fk, username: row.author_username, avatarUrl: row.author_avatar_url, email: row.author_email, createdAt: new Date(row.author_created_at), isAdmin: row.author_is_admin, location: row.author_location, points: row.author_points, postCount: authorPostCount,
                } : undefined,
                topic: row.topic_id_fk ? { id: row.topic_id_fk, title: row.topic_title, categoryId: '', authorId: '', createdAt: new Date(), lastActivity: new Date() } : undefined,
                reactions: reactionsRes.rows.map(r => ({ userId: r.user_id, username: r.username, type: r.type as ReactionType })),
            };
        }));
    } catch (error: any) {
        console.error(`[DB Error] getPostsByTopic for ${topicId}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.getPostsByTopic(topicId);
    }
};

export const getUserPostCount = async (userId: string): Promise<number> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getUserPostCount for ${userId}: Using placeholder data.`);
        return placeholder.getUserPostCount(userId);
    }
    try {
        const result = await query('SELECT COUNT(*) as count FROM posts WHERE author_id = $1', [userId]);
        return parseInt(result.rows[0].count, 10);
    } catch (error: any) {
        console.error(`[DB Error] getUserPostCount for ${userId}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.getUserPostCount(userId);
    }
};

interface CreatePostParamsDB extends Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'topic' | 'reactions'> {
    imageUrl?: string;
}
export const createPost = async (postData: CreatePostParamsDB): Promise<Post> => {
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] createPost: Using placeholder data.");
        return placeholder.createPost(postData);
    }
    if (!pool) throw new Error('Database pool not initialized.');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const now = new Date();
        const postId = uuidv4();
        const postRes = await client.query(
            'INSERT INTO posts (id, content, topic_id, author_id, created_at, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [postId, postData.content, postData.topicId, postData.authorId, now, postData.imageUrl]
        );
        const newPostDb = postRes.rows[0];
        await client.query('UPDATE topics SET last_activity = $1 WHERE id = $2', [now, postData.topicId]);
        await client.query('COMMIT');
        await updateUserLastActive(postData.authorId);
        const fullPost = (await getPostsByTopic(newPostDb.topic_id)).find(p => p.id === newPostDb.id);
        return fullPost!;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('[DB Error] createPost: Error creating post. Fallback to placeholder.', error.message);
        return placeholder.createPost(postData);
    } finally {
        client.release();
    }
};

export const updatePost = async (postId: string, content: string, userId: string, imageUrl?: string | null): Promise<Post | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] updatePost ${postId}: Using placeholder data.`);
        return placeholder.updatePost(postId, content, userId, imageUrl);
    }
    if (!pool) throw new Error('Database pool not initialized.');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const postCheck = await client.query('SELECT author_id FROM posts WHERE id = $1', [postId]);
        if (postCheck.rows.length === 0) throw new Error("Post not found.");
        const user = await findUserById(userId);
        if (!user) throw new Error("User not found.");
        const canModify = user.isAdmin || postCheck.rows[0].author_id === userId;
        if (!canModify) throw new Error("User not authorized to update this post.");

        const result = await client.query(
            'UPDATE posts SET content = $1, image_url = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [content, imageUrl, postId]
        );
        await client.query('COMMIT');
        await updateUserLastActive(userId);
        if (result.rows.length === 0) return null;
        const updatedPostData = result.rows[0];
        const fullPost = (await getPostsByTopic(updatedPostData.topic_id)).find(p => p.id === updatedPostData.id);
        return fullPost || null;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`[DB Error] updatePost ${postId}: Error updating post. Fallback to placeholder.`, error.message);
        return placeholder.updatePost(postId, content, userId, imageUrl);
    } finally {
        client.release();
    }
};

export const deletePost = async (postId: string, userId: string, isAdmin: boolean): Promise<boolean> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] deletePost ${postId}: Using placeholder data.`);
        return placeholder.deletePost(postId, userId, isAdmin);
    }
    if (!pool) throw new Error('Database pool not initialized.');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const postCheck = await client.query('SELECT author_id, topic_id FROM posts WHERE id = $1', [postId]);
        if (postCheck.rows.length === 0) return false;
        const postToDelete = postCheck.rows[0];
        const canDelete = isAdmin || postToDelete.author_id === userId;
        if (!canDelete) return false;
        
        await client.query('DELETE FROM reactions WHERE post_id = $1', [postId]);
        await client.query('DELETE FROM notifications WHERE post_id = $1', [postId]);
        const result = await client.query('DELETE FROM posts WHERE id = $1', [postId]);
        await client.query('COMMIT');
        await updateUserLastActive(userId);
        return result.rowCount > 0;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`[DB Error] deletePost ${postId}: Error deleting post. Fallback to placeholder.`, error.message);
        return placeholder.deletePost(postId, userId, isAdmin);
    } finally {
        client.release();
    }
};

export const togglePostReaction = async (postId: string, userId: string, username: string, reactionType: ReactionType): Promise<Post | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] togglePostReaction for post ${postId}: Using placeholder data.`);
        return placeholder.togglePostReaction(postId, userId, username, reactionType);
    }
    if (!pool) throw new Error('Database pool not initialized.');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const existingReaction = await client.query('SELECT type FROM reactions WHERE post_id = $1 AND user_id = $2', [postId, userId]);
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
        const postAuthorRes = await client.query('SELECT author_id FROM posts WHERE id = $1', [postId]);
        if (postAuthorRes.rows.length > 0) {
            await calculateUserPoints(postAuthorRes.rows[0].author_id);
        }
        const updatedPostData = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
        if (updatedPostData.rows.length === 0) return null;
        const fullPost = (await getPostsByTopic(updatedPostData.rows[0].topic_id)).find(p => p.id === postId);
        return fullPost || null;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`[DB Error] togglePostReaction for post ${postId}: Error. Fallback to placeholder.`, error.message);
        return placeholder.togglePostReaction(postId, userId, username, reactionType);
    } finally {
        client.release();
    }
};

// --- Count Functions for Admin Dashboard ---
export const getTotalUserCount = async (): Promise<number> => {
  if (!isDbAvailable()) {
    console.warn("[DB Fallback] getTotalUserCount: Database pool not available. Using placeholder data.");
    return placeholder.getTotalUserCount();
  }
  try {
    const result = await query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count, 10);
  } catch (error: any) {
    console.error("[DB Error] getTotalUserCount: Error querying database. Falling back to placeholder data.", error.message);
    return placeholder.getTotalUserCount();
  }
};

export const getTotalCategoryCount = async (): Promise<number> => {
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] getTotalCategoryCount: Using placeholder data.");
        return placeholder.getTotalCategoryCount();
    }
    try {
        return parseInt((await query('SELECT COUNT(*) as count FROM categories')).rows[0].count, 10);
    } catch (error: any) {
        console.error("[DB Error] getTotalCategoryCount: Fallback to placeholder.", error.message);
        return placeholder.getTotalCategoryCount();
    }
};
export const getTotalTopicCount = async (): Promise<number> => {
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] getTotalTopicCount: Using placeholder data.");
        return placeholder.getTotalTopicCount();
    }
    try {
        return parseInt((await query('SELECT COUNT(*) as count FROM topics')).rows[0].count, 10);
    } catch (error: any) {
        console.error("[DB Error] getTotalTopicCount: Fallback to placeholder.", error.message);
        return placeholder.getTotalTopicCount();
    }
};
export const getTotalPostCount = async (): Promise<number> => {
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] getTotalPostCount: Using placeholder data.");
        return placeholder.getTotalPostCount();
    }
    try {
        return parseInt((await query('SELECT COUNT(*) as count FROM posts')).rows[0].count, 10);
    } catch (error: any) {
        console.error("[DB Error] getTotalPostCount: Fallback to placeholder.", error.message);
        return placeholder.getTotalPostCount();
    }
};

// --- Notification Functions ---
export const createNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] createNotification: Using placeholder data.");
        return placeholder.createNotification(data);
    }
    try {
        const id = uuidv4();
        const result = await query(
            'INSERT INTO notifications (id, type, recipient_user_id, sender_id, post_id, topic_id, topic_title, conversation_id, reaction_type, created_at, is_read, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), FALSE, $10) RETURNING *',
            [id, data.type, data.recipientUserId, data.senderId, data.postId, data.topicId, data.topicTitle, data.conversationId, data.reactionType, data.message]
        );
        const newNotif = result.rows[0];
        return { ...newNotif, recipientUserId: newNotif.recipient_user_id, senderId: newNotif.sender_id, postId: newNotif.post_id, topicId: newNotif.topic_id, topicTitle: newNotif.topic_title, conversationId: newNotif.conversation_id, reactionType: newNotif.reaction_type, isRead: newNotif.is_read, createdAt: new Date(newNotif.created_at), senderUsername: data.senderUsername };
    } catch (error: any) {
        console.error("[DB Error] createNotification: Fallback to placeholder.", error.message);
        return placeholder.createNotification(data);
    }
};

export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getNotificationsByUserId for ${userId}: Using placeholder data.`);
        return placeholder.getNotificationsByUserId(userId);
    }
    try {
        const result = await query( `SELECT n.*, u_sender.username as sender_username FROM notifications n JOIN users u_sender ON n.sender_id = u_sender.id WHERE n.recipient_user_id = $1 ORDER BY n.created_at DESC`, [userId] );
        return result.rows.map(row => ({ ...row, recipientUserId: row.recipient_user_id, senderId: row.sender_id, postId: row.post_id, topicId: row.topic_id, topicTitle: row.topic_title, conversationId: row.conversation_id, reactionType: row.reaction_type, isRead: row.is_read, createdAt: new Date(row.created_at), senderUsername: row.sender_username }));
    } catch (error: any) {
        console.error(`[DB Error] getNotificationsByUserId for ${userId}: Fallback to placeholder.`, error.message);
        return placeholder.getNotificationsByUserId(userId);
    }
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getUnreadNotificationCount for ${userId}: Using placeholder data.`);
        return placeholder.getUnreadNotificationCount(userId);
    }
    try {
        const result = await query('SELECT COUNT(*) as count FROM notifications WHERE recipient_user_id = $1 AND is_read = FALSE', [userId]);
        return parseInt(result.rows[0].count, 10);
    } catch (error: any) {
        console.error(`[DB Error] getUnreadNotificationCount for ${userId}: Fallback to placeholder.`, error.message);
        return placeholder.getUnreadNotificationCount(userId);
    }
};

export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] markNotificationAsRead ${notificationId}: Using placeholder data.`);
        return placeholder.markNotificationAsRead(notificationId, userId);
    }
    try {
        const result = await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_user_id = $2', [notificationId, userId]);
        return result.rowCount > 0;
    } catch (error: any) {
        console.error(`[DB Error] markNotificationAsRead ${notificationId}: Fallback to placeholder.`, error.message);
        return placeholder.markNotificationAsRead(notificationId, userId);
    }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] markAllNotificationsAsRead for ${userId}: Using placeholder data.`);
        return placeholder.markAllNotificationsAsRead(userId);
    }
    try {
        const result = await query('UPDATE notifications SET is_read = TRUE WHERE recipient_user_id = $1 AND is_read = FALSE', [userId]);
        return result.rowCount > 0;
    } catch (error: any) {
        console.error(`[DB Error] markAllNotificationsAsRead for ${userId}: Fallback to placeholder.`, error.message);
        return placeholder.markAllNotificationsAsRead(userId);
    }
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
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] getOrCreateConversation: Using placeholder data.");
        return placeholder.getOrCreateConversation(userId1, userId2, subject);
    }
    try {
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
    } catch (error: any) {
        console.error("[DB Error] getOrCreateConversation: Fallback to placeholder.", error.message);
        return placeholder.getOrCreateConversation(userId1, userId2, subject);
    }
};

export const sendPrivateMessage = async (senderId: string, receiverId: string, content: string, subject?: string): Promise<PrivateMessage> => {
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] sendPrivateMessage: Using placeholder data.");
        return placeholder.sendPrivateMessage(senderId, receiverId, content, subject);
    }
    if (!pool) throw new Error('Database pool not initialized.');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const conversation = await getOrCreateConversation(senderId, receiverId, subject);
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
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('[DB Error] sendPrivateMessage: Error sending message. Fallback to placeholder.', error.message);
        return placeholder.sendPrivateMessage(senderId, receiverId, content, subject);
    } finally {
        client.release();
    }
};

export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getConversationsForUser for ${userId}: Using placeholder data.`);
        return placeholder.getConversationsForUser(userId);
    }
    try {
        const result = await query( 'SELECT * FROM conversations WHERE $1 = ANY(participant_ids) ORDER BY last_message_at DESC', [userId] );
        return result.rows.map(row => ({ ...row, participantIds: row.participant_ids, lastMessageAt: new Date(row.last_message_at), createdAt: new Date(row.created_at) }));
    } catch (error: any) {
        console.error(`[DB Error] getConversationsForUser for ${userId}: Fallback to placeholder.`, error.message);
        return placeholder.getConversationsForUser(userId);
    }
};

export const getMessagesForConversation = async (conversationId: string, currentUserId: string, markAsRead: boolean = true): Promise<PrivateMessage[]> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getMessagesForConversation ${conversationId}: Using placeholder data.`);
        return placeholder.getMessagesForConversation(conversationId, currentUserId, markAsRead);
    }
    try {
        const messagesRes = await query( 'SELECT * FROM private_messages WHERE conversation_id = $1 ORDER BY created_at ASC', [conversationId] );
        if (markAsRead) {
            await query( `UPDATE private_messages SET read_by = array_append(read_by, $1) WHERE conversation_id = $2 AND sender_id != $1 AND NOT ($1 = ANY(read_by))`, [currentUserId, conversationId] );
        }
        return messagesRes.rows.map(row => ({ ...row, conversationId: row.conversation_id, senderId: row.sender_id, readBy: row.read_by, createdAt: new Date(row.created_at) }));
    } catch (error: any) {
        console.error(`[DB Error] getMessagesForConversation ${conversationId}: Fallback to placeholder.`, error.message);
        return placeholder.getMessagesForConversation(conversationId, currentUserId, markAsRead);
    }
};

export const getUnreadPrivateMessagesCountForConversation = async (conversationId: string, userId: string): Promise<number> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getUnreadPrivateMessagesCountForConversation ${conversationId}: Using placeholder data.`);
        return placeholder.getUnreadPrivateMessagesCountForConversation(conversationId, userId);
    }
    try {
        const result = await query( 'SELECT COUNT(*) as count FROM private_messages WHERE conversation_id = $1 AND sender_id != $2 AND NOT ($2 = ANY(read_by))', [conversationId, userId] );
        return parseInt(result.rows[0].count, 10);
    } catch (error: any) {
        console.error(`[DB Error] getUnreadPrivateMessagesCountForConversation ${conversationId}: Fallback to placeholder.`, error.message);
        return placeholder.getUnreadPrivateMessagesCountForConversation(conversationId, userId);
    }
};

export const getTotalUnreadPrivateMessagesCountForUser = async (userId: string): Promise<number> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getTotalUnreadPrivateMessagesCountForUser for ${userId}: Using placeholder data.`);
        return placeholder.getTotalUnreadPrivateMessagesCountForUser(userId);
    }
    try {
        const result = await query( `SELECT COUNT(DISTINCT pm.id) as count FROM private_messages pm JOIN conversations c ON pm.conversation_id = c.id WHERE $1 = ANY(c.participant_ids) AND pm.sender_id != $1 AND NOT ($1 = ANY(pm.read_by))`, [userId] );
        return parseInt(result.rows[0].count, 10);
    } catch (error: any) {
        console.error(`[DB Error] getTotalUnreadPrivateMessagesCountForUser for ${userId}: Fallback to placeholder.`, error.message);
        return placeholder.getTotalUnreadPrivateMessagesCountForUser(userId);
    }
};

export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getConversationById ${conversationId}: Using placeholder data.`);
        return placeholder.getConversationById(conversationId);
    }
    try {
        const result = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
        return result.rows.length > 0 ? { ...result.rows[0], participantIds: result.rows[0].participant_ids, lastMessageAt: new Date(result.rows[0].last_message_at), createdAt: new Date(result.rows[0].created_at) } : null;
    } catch (error: any) {
        console.error(`[DB Error] getConversationById ${conversationId}: Fallback to placeholder.`, error.message);
        return placeholder.getConversationById(conversationId);
    }
};

// Initialization Logic
async function initializeDatabase() {
  if (!isDbAvailable()) { // Changed from `!pool` to `!isDbAvailable()` for consistency
    console.warn("Skipping database schema initialization as the database pool is not available. Check DATABASE_URL and ensure PostgreSQL is running. Placeholder data may be used.");
    return;
  }
  // Assert pool is defined for TypeScript, as isDbAvailable() checked it
  const currentPool = pool!; 
  const client = await currentPool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, is_admin BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, about_me TEXT, location TEXT, website_url TEXT, social_media_url TEXT, signature TEXT, last_active TIMESTAMPTZ, avatar_url TEXT, points INTEGER DEFAULT 0);`);
    await client.query(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);`);
    await client.query(`CREATE TABLE IF NOT EXISTS topics (id TEXT PRIMARY KEY, title TEXT NOT NULL, category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE, author_id TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id); CREATE INDEX IF NOT EXISTS idx_topics_author_id ON topics(author_id);`);
    await client.query(`CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, content TEXT NOT NULL, topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE, author_id TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ, image_url TEXT); CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id); CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);`);
    await client.query(`CREATE TABLE IF NOT EXISTS reactions (id SERIAL PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE (post_id, user_id)); CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id); CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);`);
    await client.query(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, type TEXT NOT NULL, recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id TEXT REFERENCES posts(id) ON DELETE CASCADE, topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE, topic_title TEXT, conversation_id TEXT, reaction_type TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, is_read BOOLEAN DEFAULT FALSE, message TEXT); CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id);`);
    await client.query(`CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, participant_ids TEXT[] NOT NULL, subject TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, last_message_snippet TEXT, last_message_sender_id TEXT REFERENCES users(id) ON DELETE SET NULL); CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids ON conversations USING GIN (participant_ids);`);
    await client.query(`CREATE TABLE IF NOT EXISTS private_messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, read_by TEXT[] DEFAULT '{}'); CREATE INDEX IF NOT EXISTS idx_private_messages_conversation_id ON private_messages(conversation_id);`);
    await client.query('COMMIT');
    console.log("Database tables checked/created successfully.");

    const usersCountRes = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCountRes.rows[0].count, 10) === 0) {
        console.log("No users found in DB, attempting to create initial admin user...");
        // Use the createUser function which now has DB logic
        const adminUserData = await createUser({ username: "admin", email: "admin@forumlite.com", password: "password123", isAdmin: true, lastActive: new Date(), aboutMe: "Default administrator account."});
        
        let generalCat = await getCategoryByNameInternal("General Discussion", client); // Use internal helper
        if (!generalCat) generalCat = await createCategoryInternal({name: 'General Discussion', description: 'Talk about anything.'}, client);
        
        let introCat = await getCategoryByNameInternal("Introductions", client);
        if(!introCat) introCat = await createCategoryInternal({name: 'Introductions', description: 'Introduce yourself to the community.'}, client);

        let techCat = await getCategoryByNameInternal("Technical Help", client);
        if(!techCat) techCat = await createCategoryInternal({name: 'Technical Help', description: 'Get help with technical issues.'}, client);
        
        if (adminUserData && generalCat) {
            const welcomeTopicExists = await getTopicByTitleAndCategoryInternal("Welcome to ForumLite!", generalCat.id, client);
            if (!welcomeTopicExists) {
                await createTopicInternal({ title: "Welcome to ForumLite!", categoryId: generalCat.id, authorId: adminUserData.id, firstPostContent: "This is the first topic on ForumLite. Feel free to look around and start discussions!" }, client);
            }
        }
        if (adminUserData && techCat) {
             const techTopicExists = await getTopicByTitleAndCategoryInternal("Having trouble with your PC?", techCat.id, client);
            if (!techTopicExists) {
                await createTopicInternal({ title: "Having trouble with your PC?", categoryId: techCat.id, authorId: adminUserData.id, firstPostContent: "Post your technical issues here and the community might be able to help." }, client);
            }
        }
    }
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error("Error initializing database schema:", e.message);
  } finally {
    client.release();
  }
}

// Internal helpers for initialization to use the provided client and avoid fallback loops
const getCategoryByNameInternal = async (name: string, client: any): Promise<Category | null> => {
  const result = await client.query('SELECT * FROM categories WHERE name = $1', [name]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { ...row, topicCount: 0, postCount: 0, lastPost: null, createdAt: new Date(row.created_at) };
};

const createCategoryInternal = async (categoryData: Pick<Category, 'name' | 'description'>, client: any): Promise<Category> => {
  const categoryId = uuidv4();
  const result = await client.query(
    'INSERT INTO categories (id, name, description, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [categoryId, categoryData.name, categoryData.description]
  );
  const newCategory = result.rows[0];
  return { ...newCategory, topicCount: 0, postCount: 0, lastPost: null, createdAt: new Date(newCategory.created_at) };
};

const getTopicByTitleAndCategoryInternal = async (title: string, categoryId: string, client: any): Promise<Topic | null> => {
  const result = await client.query('SELECT * FROM topics WHERE title = $1 AND category_id = $2', [title, categoryId]);
  return result.rows.length > 0 ? { ...result.rows[0], createdAt: new Date(result.rows[0].created_at), lastActivity: new Date(result.rows[0].last_activity) } : null;
};

const createTopicInternal = async (topicData: CreateTopicParamsDB, client: any): Promise<void> => {
    const now = new Date();
    const topicId = uuidv4();
    await client.query(
      'INSERT INTO topics (id, title, category_id, author_id, created_at, last_activity) VALUES ($1, $2, $3, $4, $5, $6)',
      [topicId, topicData.title, topicData.categoryId, topicData.authorId, now, now]
    );
    await client.query(
      'INSERT INTO posts (id, content, topic_id, author_id, created_at, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
      [uuidv4(), topicData.firstPostContent, topicId, topicData.authorId, now, topicData.firstPostImageUrl]
    );
};


if (isDbAvailable()) {
    initializeDatabase().catch(e => console.error("Failed to initialize database on module load:", e.message));
} else if (process.env.DATABASE_URL === undefined) { // Only run placeholder init if DATABASE_URL is truly missing, not if it's invalid
    console.warn("DATABASE_URL not set. Initializing placeholder data directly if needed (db.ts).");
    placeholder.initializePlaceholderData?.(); // Call if placeholder has an explicit init function
}
