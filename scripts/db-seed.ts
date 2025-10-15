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
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await client.query(`
      INSERT INTO users (username, email, password_hash, display_name, role, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, ['admin', 'admin@forumify.local', hashedPassword, 'Administrator', 'admin', true, true]);
    
    console.log('✅ Default admin user created (username: admin, password: admin123)');

    // Create default categories
    const categories = [
      {
        name: 'General Discussion',
        description: 'General forum discussions and conversations',
        slug: 'general-discussion'
      },
      {
        name: 'Introductions',
        description: 'New member introductions and welcome messages',
        slug: 'introductions'
      },
      {
        name: 'Help & Support',
        description: 'Technical help, support, and assistance',
        slug: 'help-support'
      },
      {
        name: 'Announcements',
        description: 'Important announcements and updates',
        slug: 'announcements'
      }
    ];

    for (const category of categories) {
      await client.query(`
        INSERT INTO categories (name, description, slug)
        VALUES ($1, $2, $3)
      `, [category.name, category.description, category.slug]);
    }
    console.log('✅ Default categories created');

    // Create default site settings
    const defaultSettings = [
      ['site_name', 'ForumLite'],
      ['site_description', 'A modern community discussion forum'],
      ['default_language', 'en'],
      ['timezone', 'UTC'],
      ['date_format', 'YYYY-MM-DD'],
      ['time_format', '24h'],
      ['registration_enabled', 'true'],
      ['email_verification_required', 'false'],
      ['admin_approval_required', 'false'],
      ['min_password_length', '8'],
      ['max_username_length', '20'],
      ['events_widget_enabled', 'true'],
      ['events_widget_position', 'above_categories'],
      ['events_widget_detail_level', 'full'],
      ['events_widget_item_count', '3'],
      ['events_widget_title', 'Upcoming Events & Webinars'],
      // SEO Defaults
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
        content: 'This forum is designed to be user-friendly and intuitive. Here are some tips to get the most out of your experience:\n\n1. **Browse Categories**: Explore different categories to find topics that interest you.\n2. **Create Topics**: Start new discussions by creating topics in relevant categories.\n3. **Reply to Posts**: Engage with the community by replying to existing topics.\n4. **Use Markdown**: Format your posts using Markdown syntax for better readability.\n5. **Be Respectful**: Follow community guidelines and treat others with respect.',
        category_slug: 'help-support'
      },
      {
        title: 'Introduce yourself here!',
        content: 'Welcome to our community! Please take a moment to introduce yourself to other members. Tell us about your interests, background, or anything you\'d like to share.',
        category_slug: 'introductions'
      }
    ];

    for (const topic of sampleTopics) {
      const categoryResult = await client.query('SELECT id FROM categories WHERE slug = $1', [topic.category_slug]);
      if (categoryResult.rows.length > 0) {
        await client.query(`
          INSERT INTO topics (title, content, author_id, category_id)
          VALUES ($1, $2, $3, $4)
        `, [topic.title, topic.content, adminUser.rows[0].id, categoryResult.rows[0].id]);
      }
    }
    console.log('✅ Sample topics created');

    // Create sample event
    const sampleEvent = await client.query(`
      INSERT INTO events (title, description, start_date, end_date, location, is_public, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'Welcome Webinar',
      'Join us for a welcome webinar to learn about the forum features and community guidelines.',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour duration
      'Online',
      true,
      adminUser.rows[0].id
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
