#!/usr/bin/env tsx

/**
 * Database Status Script
 * 
 * This script provides detailed information about the database
 * including table sizes, indexes, and performance metrics.
 */

import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getDatabaseStatus() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Database Status Report');
    console.log('=' .repeat(50));
    
    // Database information
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as version,
        pg_size_pretty(pg_database_size(current_database())) as database_size
    `);
    
    console.log('\n🗄️  Database Information:');
    console.log(`   Database: ${dbInfo.rows[0].database_name}`);
    console.log(`   User: ${dbInfo.rows[0].current_user}`);
    console.log(`   Version: ${dbInfo.rows[0].version.split(' ')[0]} ${dbInfo.rows[0].version.split(' ')[1]}`);
    console.log(`   Size: ${dbInfo.rows[0].database_size}`);
    
    // Table information
    console.log('\n📋 Table Information:');
    const tableInfo = await client.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_stat_get_tuples_returned(c.oid) as tuples_returned,
        pg_stat_get_tuples_fetched(c.oid) as tuples_fetched,
        pg_stat_get_tuples_inserted(c.oid) as tuples_inserted,
        pg_stat_get_tuples_updated(c.oid) as tuples_updated,
        pg_stat_get_tuples_deleted(c.oid) as tuples_deleted
      FROM pg_tables t
      LEFT JOIN pg_class c ON c.relname = t.tablename
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `);
    
    if (tableInfo.rows.length > 0) {
      console.log('   Table Name                Size      Rows    Inserts  Updates  Deletes');
      console.log('   ' + '-'.repeat(70));
      for (const row of tableInfo.rows) {
        const rowCount = await client.query(`SELECT COUNT(*) FROM ${row.tablename}`);
        console.log(`   ${row.tablename.padEnd(20)} ${row.size.padEnd(8)} ${rowCount.rows[0].count.padEnd(8)} ${(row.tuples_inserted || 0).toString().padEnd(8)} ${(row.tuples_updated || 0).toString().padEnd(8)} ${(row.tuples_deleted || 0).toString().padEnd(8)}`);
      }
    } else {
      console.log('   No tables found');
    }
    
    // Index information
    console.log('\n🔍 Index Information:');
    const indexInfo = await client.query(`
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY pg_relation_size(indexrelid) DESC;
    `);
    
    if (indexInfo.rows.length > 0) {
      console.log('   Table Name                Index Name              Size');
      console.log('   ' + '-'.repeat(60));
      for (const row of indexInfo.rows) {
        console.log(`   ${row.tablename.padEnd(20)} ${row.indexname.padEnd(20)} ${row.size}`);
      }
    } else {
      console.log('   No indexes found');
    }
    
    // Connection information
    console.log('\n🔗 Connection Information:');
    const connectionInfo = await client.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database();
    `);
    
    console.log(`   Total Connections: ${connectionInfo.rows[0].total_connections}`);
    console.log(`   Active Connections: ${connectionInfo.rows[0].active_connections}`);
    console.log(`   Idle Connections: ${connectionInfo.rows[0].idle_connections}`);
    
    // Recent activity
    console.log('\n📈 Recent Activity:');
    try {
      const recentUsers = await client.query(`
        SELECT username, created_at, last_login 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      if (recentUsers.rows.length > 0) {
        console.log('   Recent Users:');
        recentUsers.rows.forEach(user => {
          console.log(`     ${user.username} - Created: ${user.created_at}, Last Login: ${user.last_login || 'Never'}`);
        });
      }
    } catch (error) {
      console.log('   Could not fetch recent users');
    }
    
    try {
      const recentTopics = await client.query(`
        SELECT t.title, u.username, t.created_at
        FROM topics t
        JOIN users u ON t.author_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `);
      
      if (recentTopics.rows.length > 0) {
        console.log('\n   Recent Topics:');
        recentTopics.rows.forEach(topic => {
          console.log(`     "${topic.title}" by ${topic.username} - ${topic.created_at}`);
        });
      }
    } catch (error) {
      console.log('   Could not fetch recent topics');
    }
    
    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    try {
      const slowQueries = await client.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        ORDER BY total_time DESC
        LIMIT 5;
      `);
      
      if (slowQueries.rows.length > 0) {
        console.log('   Slowest Queries:');
        slowQueries.rows.forEach((query, index) => {
          console.log(`     ${index + 1}. ${query.query.substring(0, 60)}...`);
          console.log(`        Calls: ${query.calls}, Total Time: ${query.total_time}ms, Mean Time: ${query.mean_time}ms`);
        });
      }
    } catch (error) {
      console.log('   Performance metrics not available (pg_stat_statements extension not enabled)');
    }
    
    // Health check
    console.log('\n🏥 Health Check:');
    const healthChecks = [
      { name: 'Database Connection', test: () => client.query('SELECT 1') },
      { name: 'Users Table', test: () => client.query('SELECT COUNT(*) FROM users') },
      { name: 'Categories Table', test: () => client.query('SELECT COUNT(*) FROM categories') },
      { name: 'Topics Table', test: () => client.query('SELECT COUNT(*) FROM topics') },
      { name: 'Posts Table', test: () => client.query('SELECT COUNT(*) FROM posts') },
      { name: 'Site Settings', test: () => client.query('SELECT COUNT(*) FROM site_settings') }
    ];
    
    for (const check of healthChecks) {
      try {
        await check.test();
        console.log(`   ✅ ${check.name}: OK`);
      } catch (error) {
        console.log(`   ❌ ${check.name}: FAILED - ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Database status report completed');
    
  } catch (error) {
    console.error('❌ Database status check failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run status check if this script is executed directly
if (require.main === module) {
  getDatabaseStatus().catch(console.error);
}

export { getDatabaseStatus };
