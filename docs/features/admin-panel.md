# Admin Panel Documentation

This guide covers the ForumLite admin panel, including all administrative features, user management, and system configuration options.

## 📋 Table of Contents

- [Overview](#overview)
- [Accessing the Admin Panel](#accessing-the-admin-panel)
- [Dashboard](#dashboard)
- [User Management](#user-management)
- [Category Management](#category-management)
- [Event Management](#event-management)
- [Site Settings](#site-settings)
- [SEO Settings](#seo-settings)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The ForumLite admin panel provides comprehensive administrative control over your forum. It includes user management, content moderation, system configuration, and analytics.

### Admin Panel Features

- **User Management**: Create, edit, and manage user accounts
- **Content Management**: Manage categories, topics, and posts
- **Event Management**: Create and manage events and webinars
- **Site Configuration**: Customize forum settings and appearance
- **SEO Management**: Configure search engine optimization
- **Analytics**: View forum statistics and activity

## 🔐 Accessing the Admin Panel

### Admin Access

1. **First User**: The first registered user automatically becomes an admin
2. **Manual Promotion**: Existing admins can promote users to admin role
3. **Direct Access**: Navigate to `/admin` in your browser

### Admin Panel URL

```
http://localhost:3000/admin
```

### Navigation Structure

```
Admin Panel
├── Dashboard
├── User Management
├── Category Management
├── Event Management
├── Site Settings
└── SEO Settings
```

## 📊 Dashboard

The admin dashboard provides an overview of forum activity and key metrics.

### Dashboard Widgets

#### Forum Statistics

| Metric | Description |
|--------|-------------|
| Total Users | Number of registered users |
| Active Users | Users active in the last 30 days |
| Total Topics | Number of discussion topics |
| Total Posts | Number of posts and replies |
| Categories | Number of forum categories |
| Events | Upcoming and past events |

#### Recent Activity

- **New Users**: Recently registered users
- **Recent Topics**: Latest discussion topics
- **Recent Posts**: Latest posts and replies
- **System Events**: Admin actions and system events

#### Quick Actions

- **Create Category**: Add new forum category
- **Create Event**: Schedule new event
- **User Management**: Manage user accounts
- **Site Settings**: Configure forum settings

## 👥 User Management

### User List

Access user management at `/admin/users`.

#### User Table Columns

| Column | Description |
|--------|-------------|
| Username | User's login username |
| Email | User's email address |
| Display Name | Public display name |
| Role | User role (user/moderator/admin) |
| Status | Account status (active/inactive) |
| Joined | Registration date |
| Last Login | Last login timestamp |
| Actions | Available actions |

#### User Actions

| Action | Description | Permission Required |
|--------|-------------|-------------------|
| View Profile | View user's public profile | Admin |
| Edit User | Modify user details | Admin |
| Change Role | Promote/demote user | Admin |
| Activate/Deactivate | Enable/disable account | Admin |
| Delete User | Remove user account | Admin |
| Reset Password | Send password reset email | Admin |

### User Creation

#### Create New User

1. Click "Add User" button
2. Fill in user details:
   - Username (required, unique)
   - Email (required, unique)
   - Password (required)
   - Display Name (optional)
   - Role (user/moderator/admin)
3. Click "Create User"

#### Bulk User Operations

- **Import Users**: Upload CSV file with user data
- **Export Users**: Download user list as CSV
- **Bulk Actions**: Select multiple users for batch operations

### User Roles

#### Role Hierarchy

| Role | Permissions |
|------|-------------|
| **User** | Create topics, post replies, send messages |
| **Moderator** | User permissions + moderate content, manage topics |
| **Admin** | All permissions + user management, site settings |

#### Role Management

- **Promote User**: Upgrade user role
- **Demote User**: Downgrade user role
- **Custom Roles**: Create custom permission sets (future feature)

## 📁 Category Management

### Category List

Access category management at `/admin/categories`.

#### Category Operations

| Action | Description |
|--------|-------------|
| Create Category | Add new forum category |
| Edit Category | Modify category details |
| Delete Category | Remove category (with topics) |
| Reorder Categories | Change display order |
| Category Statistics | View topic/post counts |

### Creating Categories and Forums (New Hierarchy)

#### Forum Types

- **Category (header)**: Non-clickable grouping header shown on the homepage. Cannot contain topics directly and cannot have a parent.
- **Forum (posting area)**: Clickable board where topics are created. Must have a parent Category.

#### Create Form (Two-step)

1) Select Forum Type:
- Category (header)
- Forum (posting area)

2) Configure Details:

| Field | Applies To | Required | Description |
|-------|------------|----------|-------------|
| Name | Category & Forum | ✅ | Display name |
| Type | Category & Forum | ✅ | 'category' or 'forum' |
| Parent Category | Forum only | ✅ | Select a Category header |
| Description | Category & Forum | ❌ | Optional blurb |

Validation rules:
- If Type is Forum: Parent is required and must be a Category.
- If Type is Category: Parent must be None.

#### Admin List Columns (Updated)

- Name, Type (CATEGORY/FORUM), Parent, Description, Topics, Posts, Created Date, Actions

### Category Statistics

Each category displays:
- For Forums: **Topic Count**, **Post Count**, **Last Activity**
- For Category headers: aggregated counts across child forums
- **Growth Rate**: Activity trends

## 📅 Event Management

### Event List

Access event management at `/admin/events`.

#### Event Operations

| Action | Description |
|--------|-------------|
| Create Event | Schedule new event |
| Edit Event | Modify event details |
| Delete Event | Remove event |
| Duplicate Event | Copy existing event |
| Event Analytics | View attendance data |

### Creating Events

#### Event Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | Text | ✅ | Event title |
| Description | Rich Text | ❌ | Event description |
| Start Date | DateTime | ✅ | Event start time |
| End Date | DateTime | ✅ | Event end time |
| Location | Text | ❌ | Event location |
| Max Attendees | Number | ❌ | Attendance limit |
| Public Event | Boolean | ❌ | Visible to all users |

#### Event Types

- **Webinar**: Online presentation
- **Workshop**: Interactive session
- **Conference**: Multi-session event
- **Meetup**: Community gathering

### Event Widget Configuration

Configure the events widget display:

| Setting | Options | Description |
|---------|---------|-------------|
| Widget Position | Above/Below categories | Where to display |
| Detail Level | Full/Summary | Information shown |
| Item Count | 1-10 | Number of events |
| Widget Title | Custom text | Widget heading |

## ⚙️ Site Settings

### General Settings

Access site settings at `/admin/site-settings`.

#### Basic Configuration

| Setting | Type | Description |
|---------|------|-------------|
| Site Name | Text | Forum name |
| Site Description | Textarea | Forum description |
| Default Language | Select | Primary language |
| Timezone | Select | Server timezone |
| Date Format | Select | Date display format |
| Time Format | Select | 12h/24h format |

#### User Registration

| Setting | Type | Description |
|---------|------|-------------|
| Registration Enabled | Boolean | Allow new registrations |
| Email Verification | Boolean | Require email verification |
| Admin Approval | Boolean | Require admin approval |
| Min Password Length | Number | Password requirements |

#### Content Settings

| Setting | Type | Description |
|---------|------|-------------|
| Max Post Length | Number | Character limit |
| Allow File Uploads | Boolean | Enable file uploads |
| Max File Size | Number | Upload size limit |
| Allowed File Types | Text | MIME types |

### Events Widget Settings

Configure the events widget:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Widget Enabled | Boolean | true | Show events widget |
| Widget Position | Select | above_categories | Display location |
| Detail Level | Select | full | Information shown |
| Item Count | Number | 3 | Events to display |
| Widget Title | Text | "Upcoming Events" | Widget heading |

## 🔍 SEO Settings

Access SEO settings at `/admin/seo`.

### Basic SEO

| Setting | Type | Character Limit | Description |
|---------|------|-----------------|-------------|
| Site Title | Text | 60 | Main SEO title |
| Site Description | Textarea | 160 | Meta description |
| Keywords | Text | 200 | SEO keywords |

### Social Media

| Setting | Type | Description |
|---------|------|-------------|
| Open Graph Image | URL | Social sharing image |
| Twitter Handle | Text | Twitter username |

### Analytics

| Setting | Type | Description |
|---------|------|-------------|
| Google Analytics ID | Text | GA4 measurement ID |
| Google Search Console | Text | Verification code |
| Bing Webmaster Tools | Text | Verification code |

### Advanced SEO

| Setting | Type | Description |
|---------|------|-------------|
| Robots.txt | Textarea | Custom robots.txt |
| Sitemap Enabled | Boolean | Generate XML sitemap |

## 🔒 Security Features

### Access Control

#### Admin Authentication

- **Session Management**: Secure admin sessions
- **Two-Factor Authentication**: Optional 2FA (future feature)
- **IP Restrictions**: Limit admin access by IP (future feature)

#### Permission System

- **Role-Based Access**: Different permission levels
- **Action Logging**: Track admin actions
- **Audit Trail**: Complete activity history

### Security Settings

| Setting | Type | Description |
|---------|------|-------------|
| Session Timeout | Number | Admin session duration |
| Login Attempts | Number | Max failed login attempts |
| Password Policy | Text | Password requirements |
| Content Moderation | Boolean | Enable moderation |

### Activity Logging

The admin panel logs all administrative actions:

- **User Management**: User creation, modification, deletion
- **Content Changes**: Category, topic, post modifications
- **Settings Changes**: Configuration updates
- **Security Events**: Login attempts, permission changes

## 🔧 Troubleshooting

### Common Issues

#### Admin Panel Not Accessible

**Problem**: Cannot access `/admin` URL.

**Solutions**:
1. Verify user has admin role
2. Check if user is logged in
3. Clear browser cache and cookies
4. Check server logs for errors

#### Settings Not Saving

**Problem**: Changes in admin panel not persisting.

**Solutions**:
1. Check database connection
2. Verify user permissions
3. Check for validation errors
4. Review server logs

#### User Management Issues

**Problem**: Cannot create or edit users.

**Solutions**:
1. Verify admin permissions
2. Check for duplicate usernames/emails
3. Validate input data
4. Check database constraints

### Debug Mode

Enable debug mode for troubleshooting:

```env
# .env file
DEBUG=true
LOG_LEVEL=debug
```

### Admin Logs

Check admin panel logs:

```bash
# View admin activity logs
tail -f logs/admin.log

# Check for errors
grep -i error logs/admin.log
```

### Performance Issues

#### Slow Admin Panel

**Solutions**:
1. Optimize database queries
2. Enable caching
3. Reduce data loading
4. Use pagination

#### Memory Issues

**Solutions**:
1. Increase server memory
2. Optimize data queries
3. Implement data pagination
4. Use database indexing

---

**Last Updated**: December 2024  
**Version**: 1.0.0
