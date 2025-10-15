#!/usr/bin/env tsx

/**
 * Database Reset Script
 * 
 * This script resets the database by dropping all tables
 * and recreating them with fresh data.
 * 
 * ⚠️  WARNING: This will delete ALL data in the database!
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import readline from 'readline';

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function confirmReset(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('⚠️  WARNING: This will delete ALL data in the database! Are you sure? (type "yes" to confirm): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Database reset initiated...');
    
    // Confirm reset
    const confirmed = await confirmReset();
    if (!confirmed) {
      console.log('❌ Database reset cancelled.');
      return;
    }
    
    console.log('🗑️  Dropping all tables...');
    
    // Drop tables in reverse dependency order
    const tables = [
      'private_messages',
      'notifications', 
      'events',
      'posts',
      'topics',
      'categories',
      'users',
      'site_settings'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Error dropping table ${table}:`, error.message);
      }
    }
    
    console.log('✅ All tables dropped successfully');
    
    // Recreate tables using migration
    console.log('🔄 Recreating tables...');
    
    // Import and run migration
    const { runMigrations } = await import('./db-migrate');
    await runMigrations();
    
    console.log('✅ Tables recreated successfully');
    
    // Seed with fresh data
    console.log('🌱 Seeding database with fresh data...');
    const { seedDatabase } = await import('./db-seed');
    await seedDatabase();
    
    console.log('🎉 Database reset completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• All existing data has been deleted');
    console.log('• Database tables have been recreated');
    console.log('• Fresh sample data has been added');
    console.log('• Default admin user created (username: admin, password: admin123)');
    console.log('\n⚠️  Remember to change the admin password after first login!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run reset if this script is executed directly
if (require.main === module) {
  resetDatabase().catch(console.error);
}

export { resetDatabase };
