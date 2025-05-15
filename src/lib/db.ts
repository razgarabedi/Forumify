
// src/lib/db.ts
import { Pool } from 'pg';
import type { User, Category, Topic, Post, Notification, Conversation, PrivateMessage, Reaction, ReactionType, CategoryLastPostInfo, EventDetails, EventType, SiteSettings, EventWidgetPosition, EventWidgetDetailLevel } from './types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import * as placeholder from './placeholder-data'; // Import placeholder data functions
import { unstable_noStore as noStore } from 'next/cache';

let pool: Pool | undefined = undefined;

if (process.env.DATABASE_URL) {
  if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.error('CRITICAL: DATABASE_URL is not a valid PostgreSQL connection string. It should start with "postgresql://". Database operations will be disabled.');
  } else {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      console.log("Database pool configured using DATABASE_URL.");
    } catch (e: any) {
      console.error(`CRITICAL: Error initializing database pool with DATABASE_URL. Check if the URL is correct and the database server is accessible. Error: ${e.message}`);
      pool = undefined;
    }
  }
} else {
  console.warn('CRITICAL: DATABASE_URL environment variable is not set. Database operations will be disabled. Placeholder data will be used if available.');
  pool = undefined;
}

const isDbAvailable = (): boolean => !!pool;

export const query = (text: string, params?: any[]) => {
  if (!pool) {
    console.error("CRITICAL: Database query attempted but the connection pool is not initialized. This usually means the DATABASE_URL is missing, invalid, or the database server is not accessible. Please check server logs for earlier messages regarding DATABASE_URL configuration and ensure your database is running and configured correctly as per README.md.");
    throw new Error('Database service is unavailable. Ensure DATABASE_URL is correctly set and the database is running.');
  }
  return pool.query(text, params);
};

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

const mapDbRowToUser = async (row: any): Promise<User> => {
    return {
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password_hash,
        isAdmin: row.is_admin,
        createdAt: new Date(row.created_at),
        aboutMe: row.about_me,
        location: row.location,
        websiteUrl: row.website_url,
        socialMediaUrl: row.social_media_url,
        signature: row.signature,
        lastActive: row.last_active ? new Date(row.last_active) : undefined,
        avatarUrl: row.avatar_url,
        points: row.points ?? 0,
        postCount: await getUserPostCount(row.id),
        language: row.language as 'en' | 'de' || 'en',
    };
};

export const getAllUsers = async (): Promise<User[]> => {
  if (!isDbAvailable()) {
    console.warn("[DB Fallback] getAllUsers: Database pool not available. Using placeholder data.");
    return placeholder.getAllUsers();
  }
  try {
    const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points, language FROM users ORDER BY created_at DESC');
    return Promise.all(result.rows.map(mapDbRowToUser));
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
    const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points, language FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;
    return mapDbRowToUser(result.rows[0]);
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
    const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points, language FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return mapDbRowToUser(result.rows[0]);
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
    const result = await query('SELECT id, username, email, password_hash, is_admin, created_at, about_me, location, website_url, social_media_url, signature, last_active, avatar_url, points, language FROM users WHERE lower(username) = lower($1)', [username]);
    if (result.rows.length === 0) return null;
    return mapDbRowToUser(result.rows[0]);
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
    language?: 'en' | 'de';
}

export const createUser = async (userData: CreateUserParams): Promise<User> => {
  if (!isDbAvailable()) {
    console.warn("[DB Fallback] createUser: Database pool not available. Using placeholder data.");
    return placeholder.createUser(userData);
  }
  try {
    const userId = uuidv4();
    const now = new Date();
    const passwordHash = userData.password;

    const result = await query(
      'INSERT INTO users (id, username, email, password_hash, is_admin, created_at, last_active, about_me, location, website_url, social_media_url, signature, avatar_url, points, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
      [
        userId, userData.username, userData.email, passwordHash, userData.isAdmin ?? false,
        now, userData.lastActive || now, userData.aboutMe || `Hello, I'm ${userData.username}!`,
        userData.location, userData.websiteUrl, userData.socialMediaUrl,
        userData.signature || `Regards, ${userData.username}`,
        userData.avatarUrl || `https://avatar.vercel.sh/${userData.username}.png?size=128`, 0, userData.language || 'en'
      ]
    );
    return mapDbRowToUser(result.rows[0]);
  } catch (error: any) {
    console.error("[DB Error] createUser: Error querying database. Fallback to placeholder data (if applicable).", error.message);
    return placeholder.createUser(userData);
  }
};

export const updateUserProfile = async (userId: string, profileData: Partial<Omit<User, 'id' | 'email' | 'password' | 'isAdmin' | 'createdAt' | 'postCount' | 'points'>>): Promise<User | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] updateUserProfile for ${userId}: Database pool not available. Using placeholder data.`);
        return placeholder.updateUserProfile(userId, profileData);
    }
    try {
        const { aboutMe, location, websiteUrl, socialMediaUrl, signature, avatarUrl, language } = profileData;
        const result = await query(
            'UPDATE users SET about_me = COALESCE($1, about_me), location = COALESCE($2, location), website_url = COALESCE($3, website_url), social_media_url = COALESCE($4, social_media_url), signature = COALESCE($5, signature), avatar_url = COALESCE($6, avatar_url), language = COALESCE($7, language), last_active = NOW() WHERE id = $8 RETURNING *',
            [aboutMe, location, websiteUrl, socialMediaUrl, signature, avatarUrl, language, userId]
        );
        if (result.rows.length === 0) return null;
        return mapDbRowToUser(result.rows[0]);
    } catch (error: any) {
        console.error(`[DB Error] updateUserProfile for ${userId}: Error querying database. Falling back to placeholder data.`, error.message);
        return placeholder.updateUserProfile(userId, profileData);
    }
};

export const updateUserLastActive = async (userId: string): Promise<void> => {
    if (!isDbAvailable()) {
        return placeholder.updateUserLastActive(userId);
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
        return mapDbRowToUser(result.rows[0]);
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
        await client.query('UPDATE posts SET author_id = NULL WHERE author_id = $1', [userId]);
        await client.query('UPDATE topics SET author_id = NULL WHERE author_id = $1', [userId]);
        await client.query('DELETE FROM notifications WHERE sender_id = $1 OR recipient_user_id = $1', [userId]);
        await client.query('DELETE FROM events WHERE id IN (SELECT id FROM events WHERE TRUE)'); 

        const userConversations = await client.query('SELECT id, participant_ids FROM conversations WHERE $1 = ANY(participant_ids)', [userId]);
        for (const convo of userConversations.rows) {
            const remainingParticipants = convo.participant_ids.filter((pId: string) => pId !== userId);
            if (remainingParticipants.length < 2) {
                await client.query('DELETE FROM private_messages WHERE conversation_id = $1', [convo.id]);
                await client.query('DELETE FROM conversations WHERE id = $1', [convo.id]);
            } else {
                await client.query('UPDATE conversations SET participant_ids = $1 WHERE id = $2', [remainingParticipants, convo.id]);
            }
        }
         await client.query('DELETE FROM private_messages WHERE sender_id = $1', [userId]);
        await client.query('DELETE FROM reactions WHERE user_id = $1', [userId]);
        const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
        await client.query('COMMIT');
        return result.rowCount > 0;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[DB Error] Error deleting user:', error);
        return placeholder.deleteUser(userId);
    } finally {
        client.release();
    }
};

const mapDbRowToCategory = async (row: any): Promise<Category> => {
    let lastPostInfo: CategoryLastPostInfo | null = null;
    if (row.last_post_id) {
        lastPostInfo = {
            id: row.last_post_id,
            topicId: row.last_post_topic_id,
            topicTitle: row.last_post_topic_title,
            authorId: row.last_post_author_id,
            authorUsername: row.last_post_author_username,
            authorAvatarUrl: row.last_post_author_avatar_url,
            createdAt: new Date(row.last_post_created_at),
        };
    }

    return {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: new Date(row.created_at),
        topicCount: parseInt(row.topic_count, 10) || 0,
        postCount: parseInt(row.post_count, 10) || 0,
        lastPost: lastPostInfo,
    };
};


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
            (SELECT p_last.id FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_id,
            (SELECT t_last.id FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_topic_id,
            (SELECT t_last.title FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_topic_title,
            (SELECT u_last.id FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id JOIN users u_last ON p_last.author_id = u_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_author_id,
            (SELECT u_last.username FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id JOIN users u_last ON p_last.author_id = u_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_author_username,
            (SELECT u_last.avatar_url FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id JOIN users u_last ON p_last.author_id = u_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_author_avatar_url,
            (SELECT p_last.created_at FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_created_at
        FROM categories c
        LEFT JOIN topics t ON c.id = t.category_id
        LEFT JOIN posts p ON t.id = p.topic_id
        GROUP BY c.id, c.name, c.description, c.created_at
        ORDER BY c.created_at ASC;
    `;
    const result = await query(queryText);
    return Promise.all(result.rows.map(mapDbRowToCategory));
  } catch (error: any) {
    console.error("[DB Error] getCategories: Error querying database. Falling back to placeholder data.", error.message);
    return placeholder.getCategories();
  }
};

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
            (SELECT p_last.id FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_id,
            (SELECT t_last.id FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_topic_id,
            (SELECT t_last.title FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_topic_title,
            (SELECT u_last.id FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id JOIN users u_last ON p_last.author_id = u_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_author_id,
            (SELECT u_last.username FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id JOIN users u_last ON p_last.author_id = u_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_author_username,
            (SELECT u_last.avatar_url FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id JOIN users u_last ON p_last.author_id = u_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_author_avatar_url,
            (SELECT p_last.created_at FROM posts p_last JOIN topics t_last ON p_last.topic_id = t_last.id WHERE t_last.category_id = c.id ORDER BY p_last.created_at DESC LIMIT 1) as last_post_created_at
        FROM categories c
        LEFT JOIN topics t ON c.id = t.category_id
        LEFT JOIN posts p ON t.id = p.topic_id
        WHERE c.id = $1
        GROUP BY c.id, c.name, c.description, c.created_at;
    `;
    const result = await query(queryText, [id]);
    if (result.rows.length === 0) return null;
    return mapDbRowToCategory(result.rows[0]);
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
    const newDbCategory = result.rows[0];
    return {
        id: newDbCategory.id,
        name: newDbCategory.name,
        description: newDbCategory.description,
        createdAt: new Date(newDbCategory.created_at),
        topicCount: 0,
        postCount: 0,
        lastPost: null,
    };
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
        return getCategoryById(categoryId);
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

const mapDbRowToTopic = async (row: any): Promise<Topic> => {
    let author: User | undefined = undefined;
    if (row.author_id_fk) { // Use data from JOIN if available
        author = {
            id: row.author_id_fk,
            username: row.author_username,
            avatarUrl: row.author_avatar_url,
            email: row.author_email, // May not be needed for Topic.author display
            createdAt: new Date(row.author_created_at),
            points: row.author_points ?? 0,
            postCount: await getUserPostCount(row.author_id_fk), // Still an N+1 for lists, but okay for single topic
            isAdmin: row.author_is_admin,
            location: row.author_location,
        };
    }

    let category: Pick<Category, 'id' | 'name' | 'description' | 'createdAt'> | undefined = undefined;
    if (row.category_id_fk && row.category_name) { // Use data from JOIN if available
        category = {
            id: row.category_id_fk,
            name: row.category_name,
            description: row.category_description,
            createdAt: new Date(row.category_created_at),
        };
    }

    const firstPostContentRaw = row.first_post_content || '';
    // Normalize whitespace (multiple spaces/newlines to single space) then trim
    const cleanedContent = firstPostContentRaw.replace(/\s\s+/g, ' ').trim();
    let firstPostContentSnippet: string;

    if (cleanedContent.length > 155) {
        firstPostContentSnippet = cleanedContent.substring(0, 152).trim() + "...";
    } else {
        firstPostContentSnippet = cleanedContent;
    }

    return {
        id: row.id,
        title: row.title,
        categoryId: row.category_id, // Direct foreign key
        authorId: row.author_id,     // Direct foreign key
        createdAt: new Date(row.created_at),
        lastActivity: new Date(row.last_activity),
        postCount: parseInt(row.post_count, 10) || 0,
        author,
        category,
        firstPostContentSnippet: firstPostContentSnippet,
        firstPostImageUrl: row.first_post_image_url || undefined,
    };
};


export const getTopicsByCategory = async (categoryId: string): Promise<Topic[]> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getTopicsByCategory for ${categoryId}: Using placeholder data.`);
        return placeholder.getTopicsByCategory(categoryId);
    }
    try {
        // Note: This query does NOT fetch first_post_content and first_post_image_url for performance reasons on list views.
        // mapDbRowToTopic will handle missing firstPost fields gracefully.
        const result = await query(`
            SELECT t.id, t.title, t.category_id, t.author_id, t.created_at, t.last_activity,
                   u.id as author_id_fk, u.username as author_username, u.avatar_url as author_avatar_url, u.email as author_email, u.created_at as author_created_at, u.points as author_points, u.is_admin as author_is_admin, u.location as author_location,
                   c.id as category_id_fk, c.name as category_name, c.description as category_description, c.created_at as category_created_at,
                   (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) as post_count
            FROM topics t
            LEFT JOIN users u ON t.author_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.category_id = $1
            ORDER BY t.last_activity DESC
        `, [categoryId]);
        return Promise.all(result.rows.map(mapDbRowToTopic));
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
            SELECT t.id, t.title, t.category_id, t.author_id, t.created_at, t.last_activity,
                   u.id as author_id_fk, u.username as author_username, u.avatar_url as author_avatar_url, u.email as author_email, u.created_at as author_created_at, u.points as author_points, u.is_admin as author_is_admin, u.location as author_location,
                   c.id as category_id_fk, c.name as category_name, c.description as category_description, c.created_at as category_created_at,
                   (SELECT COUNT(*) FROM posts p_count WHERE p_count.topic_id = t.id) as post_count,
                   (SELECT p_first.content FROM posts p_first WHERE p_first.topic_id = t.id ORDER BY p_first.created_at ASC LIMIT 1) as first_post_content,
                   (SELECT p_first.image_url FROM posts p_first WHERE p_first.topic_id = t.id ORDER BY p_first.created_at ASC LIMIT 1) as first_post_image_url
            FROM topics t
            LEFT JOIN users u ON t.author_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1
        `, [id]);
        if (topicRes.rows.length === 0) return null;
        return mapDbRowToTopic(topicRes.rows[0]);
    } catch (error: any) {
        console.error(`[DB Error] getTopicById for ${id}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.getTopicById(id);
    }
};

export const getTopicByIdSimple = async (id: string): Promise<Pick<Topic, 'id' | 'title' | 'categoryId' | 'authorId' | 'createdAt' | 'lastActivity'> | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getTopicByIdSimple for ${id}: Using placeholder data.`);
        return placeholder.getTopicByIdSimple(id);
    }
    try {
        const result = await query('SELECT id, title, category_id, author_id, created_at, last_activity FROM topics WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            id: row.id, title: row.title, categoryId: row.category_id, authorId: row.author_id,
            createdAt: new Date(row.created_at), lastActivity: new Date(row.last_activity)
        };
    } catch (error: any) {
        console.error(`[DB Error] getTopicByIdSimple for ${id}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.getTopicByIdSimple(id);
    }
};

interface CreateTopicParamsDB extends Pick<Topic, 'title' | 'categoryId' | 'authorId'> {
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
        const fullTopic = await getTopicById(newTopicDb.id);
        if (!fullTopic) throw new Error("Failed to retrieve newly created topic with full details.");
        return fullTopic;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('[DB Error] createTopic: Error creating topic. Fallback to placeholder.', error.message);
        return placeholder.createTopic(topicData);
    } finally {
        client.release();
    }
};


const mapDbRowToPost = async (row: any): Promise<Post> => {
    const reactionsRes = await query('SELECT user_id, type, (SELECT username FROM users WHERE id = user_id) as username FROM reactions WHERE post_id = $1', [row.id]);

    let author: User | undefined = undefined;
    if (row.author_id_fk) {
        author = {
            id: row.author_id_fk,
            username: row.author_username,
            avatarUrl: row.author_avatar_url,
            email: row.author_email,
            createdAt: new Date(row.author_created_at),
            points: row.author_points ?? 0,
            postCount: await getUserPostCount(row.author_id_fk),
            isAdmin: row.author_is_admin,
            location: row.author_location,
            language: row.author_language as 'en' | 'de' || 'en',
        };
    }

    let topic: Pick<Topic, 'id' | 'title' | 'categoryId' | 'authorId' | 'createdAt' | 'lastActivity'> | undefined = undefined;
    if (row.topic_id_fk && row.topic_title) {
        topic = {
            id: row.topic_id_fk,
            title: row.topic_title,
            categoryId: row.topic_category_id,
            authorId: row.topic_author_id,
            createdAt: new Date(row.topic_created_at),
            lastActivity: new Date(row.topic_last_activity),
        };
    }

    return {
        id: row.id,
        content: row.content,
        topicId: row.topic_id,
        authorId: row.author_id,
        createdAt: new Date(row.created_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        imageUrl: row.image_url,
        author,
        topic,
        reactions: reactionsRes.rows.map(r => ({ userId: r.user_id, username: r.username, type: r.type as ReactionType })),
    };
};


export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getPostsByTopic for ${topicId}: Using placeholder data.`);
        return placeholder.getPostsByTopic(topicId);
    }
    try {
        const result = await query(`
            SELECT p.id, p.content, p.topic_id, p.author_id, p.created_at, p.updated_at, p.image_url,
                   u.id as author_id_fk, u.username as author_username, u.avatar_url as author_avatar_url, u.email as author_email, u.created_at as author_created_at, u.is_admin as author_is_admin, u.location as author_location, u.points as author_points, u.language as author_language,
                   t.id as topic_id_fk, t.title as topic_title, t.category_id as topic_category_id, t.author_id as topic_author_id, t.created_at as topic_created_at, t.last_activity as topic_last_activity
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            LEFT JOIN topics t ON p.topic_id = t.id
            WHERE p.topic_id = $1
            ORDER BY p.created_at ASC
        `, [topicId]);

        return Promise.all(result.rows.map(mapDbRowToPost));
    } catch (error: any) {
        console.error(`[DB Error] getPostsByTopic for ${topicId}: Error querying database. Fallback to placeholder.`, error.message);
        return placeholder.getPostsByTopic(topicId);
    }
};

export const getUserPostCount = async (userId: string): Promise<number> => {
    if (!isDbAvailable()) {
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
        const fullPost = await mapDbRowToPost(newPostDb);
        return fullPost;
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
        return mapDbRowToPost(result.rows[0]);
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
        await client.query('UPDATE topics SET last_activity = NOW() WHERE id = $1', [postToDelete.topic_id]);
        await client.query('COMMIT');
        await updateUserLastActive(userId);
        if (postToDelete.author_id) await calculateUserPoints(postToDelete.author_id);
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
        if (postAuthorRes.rows.length > 0 && postAuthorRes.rows[0].author_id) {
            await calculateUserPoints(postAuthorRes.rows[0].author_id);
        }
        const updatedPostDataQuery = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
        if (updatedPostDataQuery.rows.length === 0) return null;
        return mapDbRowToPost(updatedPostDataQuery.rows[0]);
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`[DB Error] togglePostReaction for post ${postId}: Error. Fallback to placeholder.`, error.message);
        return placeholder.togglePostReaction(postId, userId, username, reactionType);
    } finally {
        client.release();
    }
};

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

const mapDbRowToNotification = (row: any): Notification => {
    return {
        id: row.id,
        type: row.type,
        recipientUserId: row.recipient_user_id,
        senderId: row.sender_id,
        senderUsername: row.sender_username,
        postId: row.post_id,
        topicId: row.topic_id,
        topicTitle: row.topic_title,
        conversationId: row.conversation_id,
        reactionType: row.reaction_type,
        createdAt: new Date(row.created_at),
        isRead: row.is_read,
        message: row.message,
    };
};

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
        const newNotifDb = result.rows[0];
        return { ...mapDbRowToNotification(newNotifDb), senderUsername: data.senderUsername };
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
        return result.rows.map(mapDbRowToNotification);
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

const mapDbRowToConversation = (row: any): Conversation => {
    return {
        id: row.id,
        participantIds: row.participant_ids,
        subject: row.subject,
        createdAt: new Date(row.created_at),
        lastMessageAt: new Date(row.last_message_at),
        lastMessageSnippet: row.last_message_snippet,
        lastMessageSenderId: row.last_message_sender_id,
    };
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
            return mapDbRowToConversation(result.rows[0]);
        }
        const now = new Date();
        result = await query(
            'INSERT INTO conversations (id, participant_ids, subject, created_at, last_message_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [conversationId, [userId1, userId2].sort(), subject, now, now]
        );
        return mapDbRowToConversation(result.rows[0]);
    } catch (error: any) {
        console.error("[DB Error] getOrCreateConversation: Fallback to placeholder.", error.message);
        return placeholder.getOrCreateConversation(userId1, userId2, subject);
    }
};

const mapDbRowToPrivateMessage = (row: any): PrivateMessage => {
    return {
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        content: row.content,
        createdAt: new Date(row.created_at),
        readBy: row.read_by || [],
    };
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
        return mapDbRowToPrivateMessage(newMessage);
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
        return result.rows.map(mapDbRowToConversation);
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
        if (markAsRead && messagesRes.rows.length > 0) {
            await query( `UPDATE private_messages SET read_by = array_append(read_by, $1) WHERE conversation_id = $2 AND sender_id != $1 AND NOT ($1 = ANY(read_by))`, [currentUserId, conversationId] );
        }
        const finalMessagesRes = await query( 'SELECT * FROM private_messages WHERE conversation_id = $1 ORDER BY created_at ASC', [conversationId] );
        return finalMessagesRes.rows.map(mapDbRowToPrivateMessage);
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
        return result.rows.length > 0 ? mapDbRowToConversation(result.rows[0]) : null;
    } catch (error: any) {
        console.error(`[DB Error] getConversationById ${conversationId}: Fallback to placeholder.`, error.message);
        return placeholder.getConversationById(conversationId);
    }
};

// --- Event Functions ---
const mapDbRowToEvent = (row: any): EventDetails => {
    return {
        id: row.id,
        title: row.title,
        type: row.type as EventType,
        date: new Date(row.date),
        time: row.time,
        description: row.description,
        link: row.link,
        createdAt: new Date(row.created_at),
    };
};

export const createEvent = async (eventData: Omit<EventDetails, 'id' | 'createdAt'>): Promise<EventDetails> => {
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] createEvent: Using placeholder data.");
        return placeholder.createEvent(eventData);
    }
    try {
        const eventId = uuidv4();
        const result = await query(
            'INSERT INTO events (id, title, type, date, time, description, link, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
            [eventId, eventData.title, eventData.type, eventData.date, eventData.time, eventData.description, eventData.link]
        );
        return mapDbRowToEvent(result.rows[0]);
    } catch (error: any) {
        console.error("[DB Error] createEvent: Fallback to placeholder.", error.message);
        return placeholder.createEvent(eventData);
    }
};

export const getEvents = async (limit?: number): Promise<EventDetails[]> => {
    if (!isDbAvailable()) {
        console.warn("[DB Fallback] getEvents: Using placeholder data.");
        return placeholder.getEvents(limit);
    }
    try {
        const queryText = `SELECT * FROM events WHERE date >= CURRENT_DATE ORDER BY date ASC, time ASC ${limit ? 'LIMIT $1' : ''}`;
        const params = limit ? [limit] : [];
        const result = await query(queryText, params);
        return result.rows.map(mapDbRowToEvent);
    } catch (error: any) {
        console.error("[DB Error] getEvents: Fallback to placeholder.", error.message);
        return placeholder.getEvents(limit);
    }
};

export const getEventById = async (id: string): Promise<EventDetails | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] getEventById for ${id}: Using placeholder data.`);
        return placeholder.getEventById(id);
    }
    try {
        const result = await query('SELECT * FROM events WHERE id = $1', [id]);
        return result.rows.length > 0 ? mapDbRowToEvent(result.rows[0]) : null;
    } catch (error: any) {
        console.error(`[DB Error] getEventById for ${id}: Fallback to placeholder.`, error.message);
        return placeholder.getEventById(id);
    }
};

export const updateEvent = async (eventId: string, eventData: Partial<Omit<EventDetails, 'id' | 'createdAt'>>): Promise<EventDetails | null> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] updateEvent ${eventId}: Using placeholder data.`);
        return placeholder.updateEvent(eventId, eventData);
    }
    try {
        const { title, type, date, time, description, link } = eventData;
        const result = await query(
            'UPDATE events SET title = COALESCE($1, title), type = COALESCE($2, type), date = COALESCE($3, date), time = COALESCE($4, time), description = COALESCE($5, description), link = COALESCE($6, link) WHERE id = $7 RETURNING *',
            [title, type, date, time, description, link, eventId]
        );
        return result.rows.length > 0 ? mapDbRowToEvent(result.rows[0]) : null;
    } catch (error: any) {
        console.error(`[DB Error] updateEvent ${eventId}: Fallback to placeholder.`, error.message);
        return placeholder.updateEvent(eventId, eventData);
    }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] deleteEvent ${eventId}: Using placeholder data.`);
        return placeholder.deleteEvent(eventId);
    }
    try {
        const result = await query('DELETE FROM events WHERE id = $1', [eventId]);
        return result.rowCount > 0;
    } catch (error: any) {
        console.error(`[DB Error] deleteEvent ${eventId}: Fallback to placeholder.`, error.message);
        return placeholder.deleteEvent(eventId);
    }
};

// --- Site Settings Functions ---
export const getAllSiteSettings = async (): Promise<SiteSettings> => {
    noStore(); // Opt out of caching for this function
    const defaults: SiteSettings = {
        events_widget_enabled: true,
        events_widget_position: 'above_categories',
        events_widget_detail_level: 'full',
        events_widget_item_count: 3,
        events_widget_title: "Upcoming Events & Webinars",
        multilingual_enabled: false,
        default_language: 'en',
    };

    if (!isDbAvailable()) {
        console.warn("[DB Fallback] getAllSiteSettings: Using placeholder data with defaults.");
        // Ensure placeholder function also returns a complete SiteSettings object
        const placeholderSettings = await placeholder.getAllSiteSettings(); // Assuming this returns Partial<SiteSettings> or similar
        return {
            events_widget_enabled: placeholderSettings.events_widget_enabled !== undefined ? placeholderSettings.events_widget_enabled : defaults.events_widget_enabled,
            events_widget_position: placeholderSettings.events_widget_position || defaults.events_widget_position,
            events_widget_detail_level: placeholderSettings.events_widget_detail_level || defaults.events_widget_detail_level,
            events_widget_item_count: placeholderSettings.events_widget_item_count || defaults.events_widget_item_count,
            events_widget_title: placeholderSettings.events_widget_title === undefined ? defaults.events_widget_title : (placeholderSettings.events_widget_title || defaults.events_widget_title),
            multilingual_enabled: placeholderSettings.multilingual_enabled !== undefined ? placeholderSettings.multilingual_enabled : defaults.multilingual_enabled,
            default_language: placeholderSettings.default_language || defaults.default_language,
        };
    }

    try {
        const result = await query('SELECT key, value FROM site_settings');
        const settingsMap: Record<string, string> = {};
        result.rows.forEach(row => {
            settingsMap[row.key] = row.value;
        });
        
        const fetchedTitle = settingsMap.events_widget_title;

        return {
            events_widget_enabled: settingsMap.events_widget_enabled !== undefined ? settingsMap.events_widget_enabled === 'true' : defaults.events_widget_enabled,
            events_widget_position: (settingsMap.events_widget_position as EventWidgetPosition) || defaults.events_widget_position,
            events_widget_detail_level: (settingsMap.events_widget_detail_level as EventWidgetDetailLevel) || defaults.events_widget_detail_level,
            events_widget_item_count: settingsMap.events_widget_item_count !== undefined ? parseInt(settingsMap.events_widget_item_count, 10) : defaults.events_widget_item_count,
            events_widget_title: fetchedTitle === undefined ? defaults.events_widget_title : (fetchedTitle || defaults.events_widget_title),
            multilingual_enabled: settingsMap.multilingual_enabled !== undefined ? settingsMap.multilingual_enabled === 'true' : defaults.multilingual_enabled,
            default_language: (settingsMap.default_language as 'en' | 'de') || defaults.default_language,
        };
    } catch (error: any) {
        console.error("[DB Error] getAllSiteSettings: Error querying database. Falling back to defaults.", error.message);
        return defaults;
    }
};

export const updateSiteSetting = async (key: string, value: string): Promise<void> => {
    if (!isDbAvailable()) {
        console.warn(`[DB Fallback] updateSiteSetting for ${key}: Using placeholder data.`);
        return placeholder.updateSiteSetting(key, value);
    }
    try {
        await query(
            'INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
            [key, value]
        );
    } catch (error: any) {
        console.error(`[DB Error] updateSiteSetting for ${key}: Fallback to placeholder.`, error.message);
        return placeholder.updateSiteSetting(key, value);
    }
};


async function initializeDatabase() {
  if (!isDbAvailable()) {
    console.warn("Skipping database schema initialization as the database pool is not available. Check DATABASE_URL and ensure PostgreSQL is running. Placeholder data may be used.");
    return;
  }
  const currentPool = pool!;
  const client = await currentPool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, is_admin BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, about_me TEXT, location TEXT, website_url TEXT, social_media_url TEXT, signature TEXT, last_active TIMESTAMPTZ, avatar_url TEXT, points INTEGER DEFAULT 0, language TEXT DEFAULT 'en');`);
    await client.query(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);`);
    await client.query(`CREATE TABLE IF NOT EXISTS topics (id TEXT PRIMARY KEY, title TEXT NOT NULL, category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE, author_id TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id); CREATE INDEX IF NOT EXISTS idx_topics_author_id ON topics(author_id);`);
    await client.query(`CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, content TEXT NOT NULL, topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE, author_id TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ, image_url TEXT); CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id); CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);`);
    await client.query(`CREATE TABLE IF NOT EXISTS reactions (id SERIAL PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE (post_id, user_id)); CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id); CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);`);
    await client.query(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, type TEXT NOT NULL, recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id TEXT REFERENCES posts(id) ON DELETE CASCADE, topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE, topic_title TEXT, conversation_id TEXT, reaction_type TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, is_read BOOLEAN DEFAULT FALSE, message TEXT); CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id);`);
    await client.query(`CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, participant_ids TEXT[] NOT NULL, subject TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, last_message_snippet TEXT, last_message_sender_id TEXT REFERENCES users(id) ON DELETE SET NULL); CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids ON conversations USING GIN (participant_ids);`);
    await client.query(`CREATE TABLE IF NOT EXISTS private_messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, read_by TEXT[] DEFAULT '{}'); CREATE INDEX IF NOT EXISTS idx_private_messages_conversation_id ON private_messages(conversation_id);`);
    await client.query(`CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, date DATE NOT NULL, time TEXT NOT NULL, description TEXT, link TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_events_date_time ON events(date ASC, time ASC);`);
    await client.query(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT);`);
    await client.query('COMMIT');
    console.log("Database tables checked/created successfully.");

    const defaultSettingsEntries: [keyof SiteSettings, SiteSettings[keyof SiteSettings]][] = [
        ['events_widget_enabled', true],
        ['events_widget_position', 'above_categories'],
        ['events_widget_detail_level', 'full'],
        ['events_widget_item_count', 3],
        ['events_widget_title', "Upcoming Events & Webinars"],
        ['multilingual_enabled', false],
        ['default_language', 'en'],
    ];

    for (const [key, value] of defaultSettingsEntries) {
        const checkSetting = await client.query('SELECT value FROM site_settings WHERE key = $1', [key]);
        if (checkSetting.rows.length === 0) {
            await client.query('INSERT INTO site_settings (key, value) VALUES ($1, $2)', [key, String(value)]);
             console.log(`Initialized site setting: ${key} = ${value}`);
        }
    }


    const usersCountRes = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCountRes.rows[0].count, 10) === 0) {
        console.log("No users found in DB, attempting to create initial admin user...");
        await createUser({ username: "admin", email: "admin@forumlite.com", password: "password123", isAdmin: true, lastActive: new Date(), aboutMe: "Default administrator account."});

        let generalCat = await getCategoryByNameInternal("General Discussion", client);
        if (!generalCat) generalCat = await createCategoryInternal({name: 'General Discussion', description: 'Talk about anything.'}, client);

        let introCat = await getCategoryByNameInternal("Introductions", client);
        if(!introCat) introCat = await createCategoryInternal({name: 'Introductions', description: 'Introduce yourself to the community.'}, client);

        let techCat = await getCategoryByNameInternal("Technical Help", client);
        if(!techCat) techCat = await createCategoryInternal({name: 'Technical Help', description: 'Get help with technical issues.'}, client);

        const adminUser = await findUserByEmail("admin@forumlite.com");
        if (adminUser && generalCat) {
            const welcomeTopicExists = await getTopicByTitleAndCategoryInternal("Welcome to ForumLite!", generalCat.id, client);
            if (!welcomeTopicExists) {
                await createTopicInternal({ title: "Welcome to ForumLite!", categoryId: generalCat.id, authorId: adminUser.id, firstPostContent: "This is the first topic on ForumLite. Feel free to look around and start discussions!" }, client);
            }
        }
        if (adminUser && techCat) {
             const techTopicExists = await getTopicByTitleAndCategoryInternal("Having trouble with your PC?", techCat.id, client);
            if (!techTopicExists) {
                await createTopicInternal({ title: "Having trouble with your PC?", categoryId: techCat.id, authorId: adminUser.id, firstPostContent: "Post your technical issues here and the community might be able to help." }, client);
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

const getCategoryByNameInternal = async (name: string, client: any): Promise<Category | null> => {
  const result = await client.query('SELECT * FROM categories WHERE name = $1', [name]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { id: row.id, name: row.name, description: row.description, createdAt: new Date(row.created_at), topicCount: 0, postCount: 0, lastPost: null };
};

const createCategoryInternal = async (categoryData: Pick<Category, 'name' | 'description'>, client: any): Promise<Category> => {
  const categoryId = uuidv4();
  const result = await client.query(
    'INSERT INTO categories (id, name, description, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [categoryId, categoryData.name, categoryData.description]
  );
  const newCategory = result.rows[0];
  return { id: newCategory.id, name: newCategory.name, description: newCategory.description, createdAt: new Date(newCategory.created_at), topicCount: 0, postCount: 0, lastPost: null };
};

const getTopicByTitleAndCategoryInternal = async (title: string, categoryId: string, client: any): Promise<Topic | null> => {
  const result = await client.query('SELECT * FROM topics WHERE title = $1 AND category_id = $2', [title, categoryId]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
      id: row.id, title: row.title, categoryId: row.category_id, authorId: row.author_id,
      createdAt: new Date(row.created_at), lastActivity: new Date(row.last_activity), postCount:0,
      firstPostContentSnippet: '', // Placeholder, not fetched here
  };
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
} else if (process.env.DATABASE_URL === undefined) {
    console.warn("DATABASE_URL not set. Initializing placeholder data directly if needed (db.ts).");
    placeholder.initializePlaceholderData?.();
}

