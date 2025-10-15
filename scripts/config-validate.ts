#!/usr/bin/env tsx

/**
 * Configuration Validation Script
 * 
 * This script validates the application configuration
 * including environment variables and database connectivity.
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config();

interface ConfigValidation {
  name: string;
  required: boolean;
  value: string | undefined;
  valid: boolean;
  message: string;
}

async function validateConfiguration() {
  console.log('🔧 Configuration Validation');
  console.log('=' .repeat(50));
  
  const validations: ConfigValidation[] = [];
  
  // Required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_BASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ];
  
  // Optional environment variables
  const optionalVars = [
    'NODE_ENV',
    'PORT',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
    'UPLOAD_DIR',
    'MAX_FILE_SIZE',
    'ALLOWED_FILE_TYPES',
    'REDIS_URL',
    'GOOGLE_ANALYTICS_ID',
    'GOOGLE_SITE_VERIFICATION',
    'BING_SITE_VERIFICATION'
  ];
  
  // Validate required variables
  console.log('\n✅ Required Configuration:');
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const valid = !!value && value.trim().length > 0;
    
    validations.push({
      name: varName,
      required: true,
      value: value,
      valid,
      message: valid ? 'OK' : 'Missing or empty'
    });
    
    console.log(`   ${valid ? '✅' : '❌'} ${varName}: ${valid ? 'Set' : 'Missing'}`);
  }
  
  // Validate optional variables
  console.log('\n📋 Optional Configuration:');
  for (const varName of optionalVars) {
    const value = process.env[varName];
    const valid = !value || value.trim().length > 0;
    
    validations.push({
      name: varName,
      required: false,
      value: value,
      valid,
      message: valid ? (value ? 'Set' : 'Not set (optional)') : 'Invalid'
    });
    
    const status = value ? '✅ Set' : '⚪ Not set';
    console.log(`   ${status} ${varName}`);
  }
  
  // Validate specific configurations
  console.log('\n🔍 Specific Validations:');
  
  // Database URL validation
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
        console.log('   ✅ DATABASE_URL: Valid PostgreSQL connection string');
      } else {
        console.log('   ❌ DATABASE_URL: Invalid protocol (must be postgresql://)');
      }
    } catch (error) {
      console.log('   ❌ DATABASE_URL: Invalid URL format');
    }
  }
  
  // Base URL validation
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        console.log('   ✅ NEXT_PUBLIC_BASE_URL: Valid HTTP/HTTPS URL');
      } else {
        console.log('   ❌ NEXT_PUBLIC_BASE_URL: Invalid protocol (must be http:// or https://)');
      }
    } catch (error) {
      console.log('   ❌ NEXT_PUBLIC_BASE_URL: Invalid URL format');
    }
  }
  
  // NextAuth secret validation
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (nextAuthSecret) {
    if (nextAuthSecret.length >= 32) {
      console.log('   ✅ NEXTAUTH_SECRET: Sufficient length (32+ characters)');
    } else {
      console.log('   ⚠️  NEXTAUTH_SECRET: Too short (should be 32+ characters)');
    }
  }
  
  // SMTP configuration validation
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (smtpHost || smtpPort || smtpUser || smtpPass) {
    const smtpComplete = smtpHost && smtpPort && smtpUser && smtpPass;
    if (smtpComplete) {
      console.log('   ✅ SMTP Configuration: Complete');
    } else {
      console.log('   ⚠️  SMTP Configuration: Incomplete (all SMTP_* variables required)');
    }
  } else {
    console.log('   ⚪ SMTP Configuration: Not configured (email notifications disabled)');
  }
  
  // File upload configuration validation
  const uploadDir = process.env.UPLOAD_DIR;
  const maxFileSize = process.env.MAX_FILE_SIZE;
  
  if (uploadDir) {
    console.log(`   ✅ UPLOAD_DIR: ${uploadDir}`);
  }
  
  if (maxFileSize) {
    const size = parseInt(maxFileSize);
    if (!isNaN(size) && size > 0) {
      console.log(`   ✅ MAX_FILE_SIZE: ${size} bytes (${(size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      console.log('   ❌ MAX_FILE_SIZE: Invalid number');
    }
  }
  
  // Test database connection
  console.log('\n🗄️  Database Connection Test:');
  if (dbUrl) {
    try {
      const pool = new Pool({ connectionString: dbUrl });
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      await pool.end();
      console.log('   ✅ Database connection: Successful');
      console.log(`   📅 Server time: ${result.rows[0].current_time}`);
    } catch (error) {
      console.log('   ❌ Database connection: Failed');
      console.log(`   🔍 Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log('   ❌ Database connection: Cannot test (DATABASE_URL not set)');
  }
  
  // Test SMTP connection (if configured)
  console.log('\n📧 SMTP Connection Test:');
  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
      
      await transporter.verify();
      console.log('   ✅ SMTP connection: Successful');
    } catch (error) {
      console.log('   ❌ SMTP connection: Failed');
      console.log(`   🔍 Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log('   ⚪ SMTP connection: Not configured');
  }
  
  // Summary
  console.log('\n📊 Validation Summary:');
  const requiredValid = validations.filter(v => v.required && v.valid).length;
  const requiredTotal = validations.filter(v => v.required).length;
  const optionalSet = validations.filter(v => !v.required && v.value).length;
  const optionalTotal = validations.filter(v => !v.required).length;
  
  console.log(`   Required variables: ${requiredValid}/${requiredTotal} valid`);
  console.log(`   Optional variables: ${optionalSet}/${optionalTotal} set`);
  
  if (requiredValid === requiredTotal) {
    console.log('\n🎉 Configuration validation passed!');
    console.log('   All required variables are properly configured.');
  } else {
    console.log('\n❌ Configuration validation failed!');
    console.log('   Please fix the missing or invalid required variables.');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🔧 Configuration validation completed');
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateConfiguration().catch(console.error);
}

export { validateConfiguration };
