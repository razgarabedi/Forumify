#!/usr/bin/env tsx

/**
 * Database Migration Script
 * 
 * This script handles database migrations for Rexerium Forum.
 * It creates tables and applies schema changes.
 */

import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database migrations...');
    
    // Create users table (align with runtime schema in src/lib/db.ts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        about_me TEXT,
        location TEXT,
        website_url TEXT,
        social_media_url TEXT,
        signature TEXT,
        last_active TIMESTAMP WITH TIME ZONE,
        avatar_url TEXT,
        points INTEGER DEFAULT 0,
        language TEXT DEFAULT 'en'
      );
    `);
    console.log('✅ Users table created/verified');

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'forum' CHECK (type IN ('category','forum')),
        description TEXT,
        slug VARCHAR(100) UNIQUE NOT NULL,
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        topic_count INTEGER DEFAULT 0,
        post_count INTEGER DEFAULT 0,
        last_activity TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Categories table created/verified');

    // Indexes for categories
    try { await client.query(`CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)`); } catch {}
    try { await client.query(`CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)`); } catch {}

    // Create topics table (align with runtime schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(255),
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        pinned BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('✅ Topics table created/verified');

    // Add pinned column to existing topics table if it doesn't exist
    try {
      await client.query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE`);
      console.log('✅ Pinned column added to topics table');
    } catch (error) {
      console.log('ℹ️  Pinned column already exists or error adding it:', error);
    }

    // Create posts table (align with runtime schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE,
        image_url TEXT
      );
    `);
    console.log('✅ Posts table created/verified');

    // Create reactions table (align with runtime schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      );
    `);
    console.log('✅ Reactions table created/verified');

    // Create events table (align with runtime schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        description TEXT,
        link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Events table created/verified');

    // Create site_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Site settings table created/verified');

    // Create notifications table (align with runtime schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
        topic_title TEXT,
        topic_slug TEXT,
        conversation_id TEXT,
        reaction_type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_read BOOLEAN DEFAULT FALSE,
        message TEXT
      );
    `);
    console.log('✅ Notifications table created/verified');

    // Create conversations table (align with runtime schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        participant_ids TEXT[] NOT NULL,
        subject TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_message_snippet TEXT,
        last_message_sender_id UUID REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    console.log('✅ Conversations table created/verified');

    // Create private_messages table (align with runtime schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS private_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_by TEXT[] DEFAULT '{}'
      );
    `);
    console.log('✅ Private messages table created/verified');

    // Create indexes for performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id)',
      'CREATE INDEX IF NOT EXISTS idx_topics_author_id ON topics(author_id)',
      'CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id)',
      'CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)',
      'CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id)',
      'CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_private_messages_conversation_id ON private_messages(conversation_id)'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        console.log(`⚠️  Warning: Could not create index: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log('✅ Database indexes created/verified');

    console.log('🎉 Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

export { runMigrations };
