# Configuration Guide

This guide covers all configuration options available in Rexerium Forum, including environment variables, database settings, and application customization.

## 📋 Table of Contents

- [Environment Variables](#environment-variables)
- [Database Configuration](#database-configuration)
- [Application Settings](#application-settings)
- [Admin Panel Configuration](#admin-panel-configuration)
- [Security Configuration](#security-configuration)
- [Performance Configuration](#performance-configuration)
- [Email Configuration](#email-configuration)
- [File Upload Configuration](#file-upload-configuration)

## 🔧 Environment Variables

### Core Configuration

Create a `.env` file in your project root with these essential variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Application URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Security
NEXTAUTH_SECRET="your-32-character-secret-key"
```

### Complete Environment Variables Reference

| Variable | Required | Type | Default | Description |
|----------|----------|------|---------|-------------|
| `DATABASE_URL` | ✅ | string | - | PostgreSQL connection string (required, no fallback) |
| `NEXT_PUBLIC_BASE_URL` | ✅ | string | - | Public URL of your application |
| `NEXTAUTH_URL` | ✅ | string | - | URL for NextAuth.js authentication |
| `NEXTAUTH_SECRET` | ✅ | string | - | Secret key for JWT signing |
| `NODE_ENV` | ❌ | string | `development` | Environment mode |
| `PORT` | ❌ | number | `3000` | Server port |
| `SMTP_HOST` | ❌ | string | - | SMTP server hostname |
| `SMTP_PORT` | ❌ | number | `587` | SMTP server port |
| `SMTP_USER` | ❌ | string | - | SMTP username |
| `SMTP_PASS` | ❌ | string | - | SMTP password |
| `SMTP_FROM` | ❌ | string | - | From email address |
| `UPLOAD_DIR` | ❌ | string | `./uploads` | File upload directory |
| `MAX_FILE_SIZE` | ❌ | number | `10485760` | Max file size in bytes |
| `ALLOWED_FILE_TYPES` | ❌ | string | `image/*` | Allowed file MIME types |
| `REDIS_URL` | ❌ | string | - | Redis connection string |
| `GOOGLE_ANALYTICS_ID` | ❌ | string | - | Google Analytics ID |
| `GOOGLE_SITE_VERIFICATION` | ❌ | string | - | Google Search Console verification |
| `BING_SITE_VERIFICATION` | ❌ | string | - | Bing Webmaster Tools verification |

## 🗄️ Database Configuration

### PostgreSQL Setup

#### Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database_name]?[parameters]
```

#### Examples

```env
# Local development
DATABASE_URL="postgresql://forumify_user:password123@localhost:5432/forumify"

# Production with SSL
DATABASE_URL="postgresql://forumify_user:password123@db.example.com:5432/forumify?sslmode=require"

# With connection pooling
DATABASE_URL="postgresql://forumify_user:password123@localhost:5432/forumify?max=20&idleTimeoutMillis=30000"
```

#### Database Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `sslmode` | SSL connection mode | `require`, `prefer`, `disable` |
| `max` | Maximum connections | `20` |
| `idleTimeoutMillis` | Idle timeout in milliseconds | `30000` |
| `connectionTimeoutMillis` | Connection timeout | `10000` |

### Database Initialization

The application automatically creates tables on first run. Manual initialization:

```bash
# Create database
createdb forumify

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

## ⚙️ Application Settings

### Site Settings (Admin Panel)

Configure these settings through the admin panel at `/admin/site-settings`:

#### General Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `site_name` | string | "Rexerium Forum" | Name of your forum |
| `site_description` | string | "Community Discussion Forum" | Site description |
| `default_language` | string | "en" | Default language (en/de) |
| `timezone` | string | "UTC" | Default timezone |
| `date_format` | string | "YYYY-MM-DD" | Date display format |
| `time_format` | string | "24h" | Time format (12h/24h) |

#### Events Widget Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `events_widget_enabled` | boolean | `true` | Enable events widget |
| `events_widget_position` | string | "above_categories" | Widget position |
| `events_widget_detail_level` | string | "full" | Detail level (full/summary) |
| `events_widget_item_count` | number | `3` | Number of events to show |
| `events_widget_title` | string | "Upcoming Events" | Widget title |

#### SEO Settings
#### Helpful Links (New)

| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| Documentation URL | `links_docs_url` | URL | "" | Shown in footer and on Admin Dashboard if set |
| Community URL | `links_community_url` | URL | "" | Shown in footer and on Admin Dashboard if set |

#### Basics (Core Settings) (New)

| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| Welcome Banner | `core_welcome_banner` | string | "The simple, modern platform for community discussions." | Banner for logged-out users on the homepage |
| Censor Words | `core_censor_words` | multi-line string | "" | `word=****` rules, one per line or comma-separated; whole-word matches only |
| Discussion Sorting | `core_discussion_sorting` | enum | `latest` | Category topics default sort: `latest`, `newest`, or `top` |
| Allow Signups | `core_allow_signups` | boolean | `true` | If `false`, `/register` redirects to `/?error=registration_disabled` and the homepage shows an alert |

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `seo_site_title` | string | "Rexerium Forum - Light Forum Solution" | SEO title |
| `seo_site_description` | string | "Join our community..." | Meta description |
| `seo_site_keywords` | string | "forum, community" | SEO keywords |
| `seo_og_image` | string | "" | Open Graph image URL |
| `seo_twitter_handle` | string | "" | Twitter handle |
| `seo_google_analytics_id` | string | "" | Google Analytics ID |
| `seo_robots_txt` | string | "User-agent: *\nAllow: /" | Custom robots.txt |
| `seo_sitemap_enabled` | boolean | `true` | Enable XML sitemap |

### User Settings

#### Registration Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `registration_enabled` | boolean | `true` | Allow new registrations |
| `email_verification_required` | boolean | `false` | Require email verification |
| `admin_approval_required` | boolean | `false` | Require admin approval |
| `min_password_length` | number | `8` | Minimum password length |
| `max_username_length` | number | `20` | Maximum username length |

#### User Permissions

| Permission | Description |
|------------|-------------|
| `can_create_topics` | Create new discussion topics |
| `can_reply_to_topics` | Reply to existing topics |
| `can_edit_own_posts` | Edit own posts |
| `can_delete_own_posts` | Delete own posts |
| `can_upload_files` | Upload files/images |
| `can_send_private_messages` | Send private messages |

## 🔒 Security Configuration

### Authentication Settings

```env
# NextAuth.js Configuration
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# Session Configuration
NEXTAUTH_SESSION_MAX_AGE="30"  # days
NEXTAUTH_SESSION_UPDATE_AGE="1"  # days
```

### Password Security

```env
# Password Requirements
MIN_PASSWORD_LENGTH="8"
REQUIRE_UPPERCASE="true"
REQUIRE_LOWERCASE="true"
REQUIRE_NUMBERS="true"
REQUIRE_SYMBOLS="false"
```

### Rate Limiting

```env
# Rate Limiting (requests per minute)
RATE_LIMIT_POSTS="10"
RATE_LIMIT_LOGIN="5"
RATE_LIMIT_REGISTRATION="3"
RATE_LIMIT_MESSAGES="20"
```

### CORS Configuration

```env
# CORS Settings
CORS_ORIGIN="https://yourdomain.com"
CORS_CREDENTIALS="true"
CORS_METHODS="GET,POST,PUT,DELETE"
CORS_HEADERS="Content-Type,Authorization"
```

## 🚀 Performance Configuration

### Caching

```env
# Redis Configuration (optional)
REDIS_URL="redis://localhost:6379"
CACHE_TTL="3600"  # seconds

# Next.js Caching
NEXT_CACHE_TTL="86400"  # 24 hours
```

### Database Optimization

```env
# Connection Pooling
DB_POOL_MIN="2"
DB_POOL_MAX="10"
DB_POOL_IDLE_TIMEOUT="30000"
DB_POOL_ACQUIRE_TIMEOUT="60000"
```

### File Upload Limits

```env
# Upload Configuration
MAX_FILE_SIZE="10485760"  # 10MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,image/webp"
UPLOAD_DIR="./uploads"
```

## 📧 Email Configuration

### SMTP Settings

```env
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"  # true for port 465
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Rexerium Forum <noreply@yourdomain.com>"
```

### Email Templates

Configure email templates in the admin panel:

- **Welcome Email**: Sent to new users
- **Password Reset**: Password reset instructions
- **Email Verification**: Account verification
- **Notification Digest**: Daily/weekly notifications

### Email Providers

#### Gmail Setup

1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in `SMTP_PASS`

#### SendGrid Setup

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

#### Mailgun Setup

```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="your-mailgun-username"
SMTP_PASS="your-mailgun-password"
```

## 📁 File Upload Configuration

### Upload Settings

```env
# Upload Directory
UPLOAD_DIR="./uploads"

# File Size Limits
MAX_FILE_SIZE="10485760"  # 10MB
MAX_IMAGE_SIZE="5242880"  # 5MB for images

# Allowed File Types
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,image/webp,application/pdf"

# File Naming
FILE_NAMING="uuid"  # uuid, timestamp, original
```

### Storage Options

#### Local Storage (Default)

```env
STORAGE_TYPE="local"
UPLOAD_DIR="./uploads"
```

#### AWS S3

```env
STORAGE_TYPE="s3"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_BUCKET="your-bucket-name"
```

#### Cloudinary

```env
STORAGE_TYPE="cloudinary"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## 🔧 Advanced Configuration

### Custom Themes

```env
# Theme Configuration
THEME_PRIMARY_COLOR="#3b82f6"
THEME_SECONDARY_COLOR="#64748b"
THEME_ACCENT_COLOR="#f59e0b"
THEME_FONT_FAMILY="Inter, sans-serif"
```

### Internationalization

```env
# i18n Configuration
DEFAULT_LOCALE="en"
SUPPORTED_LOCALES="en,de,fr,es"
LOCALE_DETECTION="true"
```

### Monitoring & Analytics

```env
# Google Analytics
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"

# Error Tracking
SENTRY_DSN="your-sentry-dsn"

# Performance Monitoring
NEW_RELIC_LICENSE_KEY="your-newrelic-key"
```

## 📝 Configuration Validation

### Environment Check

Create a configuration validation script:

```bash
# Check configuration
npm run config:validate

# Test database connection
npm run db:test

# Test email configuration
npm run email:test
```

### Configuration Examples

#### Development Environment

```env
# .env.development
NODE_ENV=development
DATABASE_URL="postgresql://forumify_user:password@localhost:5432/forumify_dev"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key"
SMTP_HOST="localhost"
SMTP_PORT="1025"  # MailHog for testing
```

#### Production Environment

```env
# .env.production
NODE_ENV=production
DATABASE_URL="postgresql://forumify_user:secure_password@db.example.com:5432/forumify"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-32-character-production-secret"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
REDIS_URL="redis://redis.example.com:6379"
```

## 🔍 Troubleshooting Configuration

### Common Issues

#### Database Connection Failed

```bash
# Test connection
psql "postgresql://username:password@host:port/database"

# Check if database exists
psql -U postgres -l

# Check user permissions
psql -U postgres -c "\du"
```

#### Email Not Sending

```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Check email logs
tail -f logs/email.log
```

#### File Upload Issues

```bash
# Check upload directory permissions
ls -la uploads/

# Check disk space
df -h

# Test file upload
curl -X POST -F "file=@test.jpg" http://localhost:3000/api/upload
```

### Configuration Validation

```bash
# Validate all configuration
npm run config:check

# Test specific components
npm run test:database
npm run test:email
npm run test:upload
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0
