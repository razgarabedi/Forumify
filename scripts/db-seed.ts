#!/usr/bin/env tsx

/**
 * Database Seeding Script
 * 
 * This script seeds the database with initial data for ForumLite.
 * It creates default categories, settings, and sample content.
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if data already exists
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('⚠️  Database already contains data. Skipping seeding.');
      return;
    }

    // Create default admin user
    const hashedPassword = 'admin123'; // plaintext to match current login comparison
    const adminUser = await client.query(`
      INSERT INTO users (username, email, password_hash, is_admin, created_at, last_active)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id
    `, ['admin', 'admin@forumlite.com', hashedPassword, true]);
    
    console.log('✅ Default admin user created (username: admin, password: admin123)');

    // Create default hierarchy: headers and forums
    const headerGeneral = await client.query(`
      INSERT INTO categories (name, description, slug, type)
      VALUES ($1, $2, $3, 'category') RETURNING id
    `, ['Community', 'Top-level community sections', 'community']);
    const headerSupport = await client.query(`
      INSERT INTO categories (name, description, slug, type)
      VALUES ($1, $2, $3, 'category') RETURNING id
    `, ['Support', 'Get help and support', 'support']);

    const forums = [
      { name: 'General Discussion', desc: 'General forum discussions and conversations', slug: 'general-discussion', parent: headerGeneral.rows[0].id },
      { name: 'Introductions', desc: 'New member introductions and welcome messages', slug: 'introductions', parent: headerGeneral.rows[0].id },
      { name: 'Help & Support', desc: 'Technical help, support, and assistance', slug: 'help-support', parent: headerSupport.rows[0].id },
      { name: 'Announcements', desc: 'Important announcements and updates', slug: 'announcements', parent: headerGeneral.rows[0].id }
    ];

    for (const f of forums) {
      await client.query(`
        INSERT INTO categories (name, description, slug, type, parent_id)
        VALUES ($1, $2, $3, 'forum', $4)
      `, [f.name, f.desc, f.slug, f.parent]);
    }
    console.log('✅ Default categories and forums created');

    // Create default site settings
    const defaultSettings = [
      ['events_widget_enabled', 'true'],
      ['events_widget_position', 'above_categories'],
      ['events_widget_detail_level', 'full'],
      ['events_widget_item_count', '3'],
      ['events_widget_title', 'Upcoming Events & Webinars'],
      ['seo_site_title', 'ForumLite - Community Discussion Forum'],
      ['seo_site_description', 'Join our community forum for engaging discussions, helpful topics, and connecting with like-minded people.'],
      ['seo_site_keywords', 'forum, community, discussion, topics, posts, social'],
      ['seo_og_image', ''],
      ['seo_twitter_handle', ''],
      ['seo_google_analytics_id', ''],
      ['seo_google_site_verification', ''],
      ['seo_bing_site_verification', ''],
      ['seo_robots_txt', 'User-agent: *\nAllow: /'],
      ['seo_sitemap_enabled', 'true']
    ];

    for (const [key, value] of defaultSettings) {
      await client.query(`
        INSERT INTO site_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING
      `, [key, value]);
    }
    console.log('✅ Default site settings created');

    // Create sample topics
    const sampleTopics = [
      {
        title: 'Welcome to ForumLite!',
        content: 'Welcome to our community forum! This is a sample topic to get you started. Feel free to introduce yourself and start participating in discussions.',
        category_slug: 'announcements'
      },
      {
        title: 'How to use this forum',
        content: 'This forum is designed to be user-friendly and intuitive. Here are some tips to get the most out of your experience.',
        category_slug: 'help-support'
      },
      {
        title: 'Introduce yourself here!',
        content: 'Welcome to our community! Please take a moment to introduce yourself to other members.',
        category_slug: 'introductions'
      }
    ];

    for (const topic of sampleTopics) {
      const categoryResult = await client.query('SELECT id FROM categories WHERE slug = $1', [topic.category_slug]);
      if (categoryResult.rows.length > 0) {
        // Insert topic and first post separately (align with runtime)
        const t = await client.query(`
          INSERT INTO topics (title, slug, category_id, author_id, created_at, last_activity)
          VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id
        `, [topic.title, `${topic.category_slug}-${topic.title}`.toLowerCase().replace(/\s+/g,'-').slice(0,200), categoryResult.rows[0].id, adminUser.rows[0].id]);
        await client.query(`
          INSERT INTO posts (content, topic_id, author_id, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [topic.content, t.rows[0].id, adminUser.rows[0].id]);
      }
    }
    console.log('✅ Sample topics created');

    // Create sample event
    await client.query(`
      INSERT INTO events (title, type, date, time, description, link)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'Welcome Webinar',
      'event',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      '18:00',
      'Join us for a welcome webinar to learn about the forum features and community guidelines.',
      '#'
    ]);
    console.log('✅ Sample event created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• Admin user created (username: admin, password: admin123)');
    console.log('• 4 default categories created');
    console.log('• Default site settings configured');
    console.log('• 3 sample topics created');
    console.log('• 1 sample event created');
    console.log('\n⚠️  Remember to change the admin password after first login!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };
