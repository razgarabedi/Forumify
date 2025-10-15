# Database Documentation

This document provides comprehensive information about ForumLite's database schema, relationships, and data management.

## 📋 Table of Contents

- [Overview](#overview)
- [Database Schema](#database-schema)
- [Table Relationships](#table-relationships)
- [Data Types](#data-types)
- [Indexes](#indexes)
- [Queries](#queries)
- [Migrations](#migrations)
- [Backup & Recovery](#backup--recovery)

## 🎯 Overview

ForumLite uses PostgreSQL as its primary database. The schema is designed for scalability, performance, and data integrity.

### Database Features

- **ACID Compliance**: Full transaction support
- **JSON Support**: Native JSON/JSONB columns
- **Full-Text Search**: Built-in search capabilities
- **Concurrent Access**: Multi-user support
- **Data Integrity**: Foreign key constraints and validation

## 🗄️ Database Schema

### Core Tables

#### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Categories Table

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    topic_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Topics Table

```sql
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    post_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Posts Table

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Events Table

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Site Settings Table

```sql
CREATE TABLE site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Private Messages Table

```sql
CREATE TABLE private_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔗 Table Relationships

### Entity Relationship Diagram

```
Users (1) ──── (N) Topics
  │                │
  │                │
  └── (N) Posts ───┘
  │
  └── (N) Events
  │
  └── (N) Notifications
  │
  └── (N) Private Messages

Categories (1) ──── (N) Topics
```

### Foreign Key Relationships

| Parent Table | Child Table | Relationship | On Delete |
|--------------|-------------|--------------|-----------|
| users | topics | One-to-Many | CASCADE |
| users | posts | One-to-Many | CASCADE |
| users | events | One-to-Many | CASCADE |
| users | notifications | One-to-Many | CASCADE |
| users | private_messages | One-to-Many | CASCADE |
| categories | topics | One-to-Many | CASCADE |
| topics | posts | One-to-Many | CASCADE |
| posts | posts | Self-referencing | CASCADE |

## 📊 Data Types

### UUID Usage

All primary keys use UUID v4 for:
- **Security**: Non-sequential IDs
- **Scalability**: Distributed system friendly
- **Uniqueness**: Globally unique identifiers

### Timestamp Handling

All timestamps use `TIMESTAMP WITH TIME ZONE`:
- **Consistency**: UTC storage with timezone awareness
- **Accuracy**: Precise time tracking
- **Compatibility**: Works across timezones

### JSON/JSONB Usage

JSONB columns for flexible data:
- **Notifications**: `data` field for additional metadata
- **Settings**: Complex configuration storage
- **Search**: Full-text search capabilities

## 🚀 Indexes

### Performance Indexes

```sql
-- User indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Topic indexes
CREATE INDEX idx_topics_category_id ON topics(category_id);
CREATE INDEX idx_topics_author_id ON topics(author_id);
CREATE INDEX idx_topics_created_at ON topics(created_at);
CREATE INDEX idx_topics_last_activity ON topics(last_activity);
CREATE INDEX idx_topics_is_pinned ON topics(is_pinned);

-- Post indexes
CREATE INDEX idx_posts_topic_id ON posts(topic_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_parent_id ON posts(parent_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);

-- Event indexes
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_is_public ON events(is_public);
CREATE INDEX idx_events_created_by ON events(created_by);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Message indexes
CREATE INDEX idx_private_messages_conversation_id ON private_messages(conversation_id);
CREATE INDEX idx_private_messages_sender_id ON private_messages(sender_id);
CREATE INDEX idx_private_messages_recipient_id ON private_messages(recipient_id);
```

### Full-Text Search Indexes

```sql
-- Topic search
CREATE INDEX idx_topics_search ON topics USING gin(to_tsvector('english', title || ' ' || content));

-- Post search
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', content));

-- User search
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', username || ' ' || COALESCE(display_name, '') || ' ' || COALESCE(bio, '')));
```

## 🔍 Queries

### Common Query Patterns

#### Get Topics with Author and Category

```sql
SELECT 
    t.id,
    t.title,
    t.content,
    t.created_at,
    t.post_count,
    t.view_count,
    u.username as author_username,
    u.avatar_url as author_avatar,
    c.name as category_name,
    c.slug as category_slug
FROM topics t
JOIN users u ON t.author_id = u.id
JOIN categories c ON t.category_id = c.id
WHERE c.id = $1
ORDER BY t.is_pinned DESC, t.last_activity DESC
LIMIT $2 OFFSET $3;
```

#### Get Posts with Replies

```sql
SELECT 
    p.id,
    p.content,
    p.created_at,
    p.is_edited,
    u.username as author_username,
    u.avatar_url as author_avatar,
    parent.id as parent_id
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN posts parent ON p.parent_id = parent.id
WHERE p.topic_id = $1
ORDER BY p.created_at ASC;
```

#### Search Topics

```sql
SELECT 
    t.id,
    t.title,
    t.content,
    t.created_at,
    u.username as author_username,
    c.name as category_name,
    ts_rank(to_tsvector('english', t.title || ' ' || t.content), plainto_tsquery('english', $1)) as rank
FROM topics t
JOIN users u ON t.author_id = u.id
JOIN categories c ON t.category_id = c.id
WHERE to_tsvector('english', t.title || ' ' || t.content) @@ plainto_tsquery('english', $1)
ORDER BY rank DESC, t.created_at DESC
LIMIT $2;
```

#### Get User Statistics

```sql
SELECT 
    u.id,
    u.username,
    u.created_at,
    COUNT(DISTINCT t.id) as topic_count,
    COUNT(DISTINCT p.id) as post_count,
    MAX(t.created_at) as last_topic_created,
    MAX(p.created_at) as last_post_created
FROM users u
LEFT JOIN topics t ON u.id = t.author_id
LEFT JOIN posts p ON u.id = p.author_id
WHERE u.id = $1
GROUP BY u.id, u.username, u.created_at;
```

## 🔄 Migrations

### Migration System

ForumLite uses a custom migration system for database schema changes:

```typescript
// Migration example
export async function up(db: Database) {
  await db.query(`
    CREATE TABLE new_feature (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

export async function down(db: Database) {
  await db.query(`DROP TABLE new_feature;`);
}
```

### Running Migrations

```bash
# Run all pending migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Check migration status
npm run db:status
```

## 💾 Backup & Recovery

### Backup Strategies

#### Full Database Backup

```bash
# Create backup
pg_dump -h localhost -U username -d forumify > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Incremental Backup

```bash
# Backup only data changes
pg_dump -h localhost -U username -d forumify --data-only --inserts > incremental_backup.sql
```

### Recovery Procedures

#### Restore from Backup

```bash
# Restore full backup
psql -h localhost -U username -d forumify < backup_file.sql

# Restore compressed backup
gunzip -c backup_file.sql.gz | psql -h localhost -U username -d forumify
```

#### Point-in-Time Recovery

```bash
# Enable WAL archiving
archive_mode = on
archive_command = 'cp %p /path/to/archive/%f'

# Restore to specific point in time
pg_basebackup -h localhost -U username -D /path/to/backup
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DB_NAME="forumify"
DB_USER="forumify_user"
BACKUP_DIR="/path/to/backups"
RETENTION_DAYS=30

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Clean old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: backup_$(date +%Y%m%d_%H%M%S).sql.gz"
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0
