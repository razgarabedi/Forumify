#!/usr/bin/env tsx

/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and verifies
 * that all required tables exist.
 */

import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    console.log(`   Server time: ${result.rows[0].current_time}`);
    
    // Test database version
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ PostgreSQL version: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}`);
    
    // Check required tables
    const requiredTables = [
      'users',
      'categories', 
      'topics',
      'posts',
      'events',
      'site_settings',
      'notifications',
      'private_messages'
    ];
    
    console.log('\n📋 Checking required tables...');
    for (const table of requiredTables) {
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (tableCheck.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    
    // Check table row counts
    console.log('\n📊 Table row counts:');
    for (const table of requiredTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ${table}: ${countResult.rows[0].count} rows`);
      } catch (error) {
        console.log(`   ${table}: Error counting rows`);
      }
    }
    
    // Check indexes
    console.log('\n🔍 Checking database indexes...');
    const indexResult = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('✅ Database indexes found:');
      indexResult.rows.forEach(row => {
        console.log(`   ${row.tablename}.${row.indexname}`);
      });
    } else {
      console.log('⚠️  No custom indexes found');
    }
    
    // Test basic queries
    console.log('\n🧪 Testing basic queries...');
    
    try {
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`✅ User query successful: ${userCount.rows[0].count} users`);
    } catch (error) {
      console.log('❌ User query failed:', error.message);
    }
    
    try {
      const categoryCount = await client.query('SELECT COUNT(*) FROM categories');
      console.log(`✅ Category query successful: ${categoryCount.rows[0].count} categories`);
    } catch (error) {
      console.log('❌ Category query failed:', error.message);
    }
    
    // Check environment variables
    console.log('\n🔧 Environment configuration:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || '❌ Missing'}`);
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testDatabase().catch(console.error);
}

export { testDatabase };
