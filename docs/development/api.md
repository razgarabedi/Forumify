# API Documentation

This document provides comprehensive information about Rexerium Forum's API endpoints, data structures, and integration methods.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)
- [SDK & Libraries](#sdk--libraries)

## 🎯 Overview

Rexerium Forum provides a RESTful API for programmatic access to forum data and functionality. The API is built on Next.js App Router with server actions and follows REST conventions.

### Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

### API Versioning

Currently using version 1 (v1) of the API. Version is specified in the URL path:

```
/api/v1/endpoint
```

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🔐 Authentication

### Authentication Methods

Rexerium Forum uses session-based authentication with NextAuth.js:

1. **Session Cookies**: Automatic authentication via HTTP cookies
2. **API Keys**: For programmatic access (optional)
3. **JWT Tokens**: For mobile applications (optional)

### Authentication Headers

```http
# Session-based (automatic with cookies)
Cookie: forum_session=session_id

# API Key (if enabled)
Authorization: Bearer your_api_key

# JWT Token (if enabled)
Authorization: Bearer jwt_token
```

### Getting Authentication

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "your_username",
      "email": "user@example.com",
      "role": "user"
    },
    "session": "session_id"
  }
}
```

#### Logout

```http
POST /api/auth/logout
```

## 📡 API Endpoints

### User Management

#### Get Current User

```http
GET /api/user/me
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "displayName": "Display Name",
    "avatar": "avatar_url",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-01T00:00:00Z"
  }
}
```

#### Update User Profile

```http
PUT /api/user/profile
Content-Type: application/json

{
  "displayName": "New Display Name",
  "email": "newemail@example.com",
  "bio": "User biography"
}
```

#### Get User by Username

```http
GET /api/user/{username}
```

### Categories

#### List Categories

```http
GET /api/categories
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "category_id",
      "name": "General Discussion",
      "description": "General forum discussions",
      "slug": "general-discussion",
      "topicCount": 25,
      "postCount": 150,
      "lastActivity": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Category

```http
GET /api/categories/{categoryId}
```

#### Create Category (Admin)

```http
POST /api/categories
Content-Type: application/json

{
  "name": "New Category",
  "description": "Category description",
  "slug": "new-category"
}
```

### Topics

#### List Topics

```http
GET /api/topics?category={categoryId}&page={page}&limit={limit}
```

Query Parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | - | Filter by category ID |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `sort` | string | "latest" | Sort order (latest, popular, oldest) |
| `search` | string | - | Search query |

Response:

```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "topic_id",
        "title": "Topic Title",
        "content": "Topic content...",
        "author": {
          "id": "user_id",
          "username": "username",
          "avatar": "avatar_url"
        },
        "category": {
          "id": "category_id",
          "name": "Category Name"
        },
        "postCount": 5,
        "viewCount": 100,
        "isPinned": false,
        "isLocked": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### Get Topic

```http
GET /api/topics/{topicId}
```

#### Create Topic

```http
POST /api/topics
Content-Type: application/json

{
  "title": "Topic Title",
  "content": "Topic content...",
  "categoryId": "category_id"
}
```

#### Update Topic

```http
PUT /api/topics/{topicId}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### Delete Topic

```http
DELETE /api/topics/{topicId}
```

### Posts

#### List Posts

```http
GET /api/topics/{topicId}/posts?page={page}&limit={limit}
```

#### Create Post

```http
POST /api/topics/{topicId}/posts
Content-Type: application/json

{
  "content": "Post content...",
  "parentId": "parent_post_id"  // For replies
}
```

#### Update Post

```http
PUT /api/posts/{postId}
Content-Type: application/json

{
  "content": "Updated post content..."
}
```

#### Delete Post

```http
DELETE /api/posts/{postId}
```

### Events

#### List Events

```http
GET /api/events?status={status}&page={page}&limit={limit}
```

Query Parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | "upcoming" | Event status (upcoming, past, all) |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

#### Create Event (Admin)

```http
POST /api/events
Content-Type: application/json

{
  "title": "Event Title",
  "description": "Event description...",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-01T02:00:00Z",
  "location": "Event Location",
  "maxAttendees": 100,
  "isPublic": true
}
```

### Private Messages

#### List Conversations

```http
GET /api/messages/conversations
```

#### Get Conversation

```http
GET /api/messages/conversations/{conversationId}
```

#### Send Message

```http
POST /api/messages/conversations/{conversationId}/messages
Content-Type: application/json

{
  "content": "Message content..."
}
```

#### Start Conversation

```http
POST /api/messages/conversations
Content-Type: application/json

{
  "recipientId": "user_id",
  "subject": "Message Subject",
  "content": "Initial message content..."
}
```

### Notifications

#### List Notifications

```http
GET /api/notifications?page={page}&limit={limit}&unread={unread}
```

#### Mark Notification as Read

```http
PUT /api/notifications/{notificationId}/read
```

#### Mark All Notifications as Read

```http
PUT /api/notifications/read-all
```

### Admin Endpoints

#### Site Settings

```http
GET /api/admin/settings
PUT /api/admin/settings
```

#### User Management

```http
GET /api/admin/users
PUT /api/admin/users/{userId}
DELETE /api/admin/users/{userId}
```

#### Category Management

```http
POST /api/admin/categories
PUT /api/admin/categories/{categoryId}
DELETE /api/admin/categories/{categoryId}
```

## 📊 Data Models

### User Model

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}
```

### Category Model

```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  topicCount: number;
  postCount: number;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Topic Model

```typescript
interface Topic {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: User;
  categoryId: string;
  category: Category;
  postCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActivity?: Date;
}
```

### Post Model

```typescript
interface Post {
  id: string;
  content: string;
  authorId: string;
  author: User;
  topicId: string;
  topic: Topic;
  parentId?: string;
  parent?: Post;
  replies: Post[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Event Model

```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  maxAttendees?: number;
  currentAttendees: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_REQUIRED` | User not authenticated |
| `AUTHORIZATION_DENIED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `FILE_TOO_LARGE` | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE` | File type not allowed |

## 🚦 Rate Limiting

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Post Creation | 10 requests | 1 hour |
| Message Sending | 20 requests | 1 hour |
| General API | 100 requests | 1 hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

## 💡 Examples

### JavaScript/Node.js

```javascript
// Using fetch API
const response = await fetch('/api/topics', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies for authentication
});

const data = await response.json();

if (data.success) {
  console.log('Topics:', data.data.topics);
} else {
  console.error('Error:', data.error);
}
```

### Python

```python
import requests

# Create a session to maintain cookies
session = requests.Session()

# Login
login_response = session.post('/api/auth/login', json={
    'username': 'your_username',
    'password': 'your_password'
})

if login_response.json()['success']:
    # Get topics
    topics_response = session.get('/api/topics')
    topics = topics_response.json()['data']['topics']
    print(f"Found {len(topics)} topics")
```

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}' \
  -c cookies.txt

# Get topics (using saved cookies)
curl -X GET http://localhost:3000/api/topics \
  -b cookies.txt \
  -H "Content-Type: application/json"
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useTopics(categoryId?: string) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const url = categoryId 
          ? `/api/topics?category=${categoryId}`
          : '/api/topics';
        
        const response = await fetch(url, {
          credentials: 'include',
        });
        
        const data = await response.json();
        
        if (data.success) {
          setTopics(data.data.topics);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [categoryId]);

  return { topics, loading, error };
}
```

## 📚 SDK & Libraries

### Official SDKs

Currently, Rexerium Forum doesn't provide official SDKs, but you can use the REST API with any HTTP client.

### Recommended Libraries

#### JavaScript/TypeScript

```bash
# Axios
npm install axios

# Fetch API (built-in)
# No installation required
```

#### Python

```bash
# Requests
pip install requests

# httpx (async)
pip install httpx
```

#### PHP

```bash
# Guzzle HTTP
composer require guzzlehttp/guzzle
```

#### Go

```bash
# Go HTTP client (built-in)
# No installation required
```

### SDK Examples

#### Axios (JavaScript)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

// Login
const login = async (username, password) => {
  const response = await api.post('/auth/login', {
    username,
    password,
  });
  return response.data;
};

// Get topics
const getTopics = async (categoryId) => {
  const response = await api.get('/topics', {
    params: { category: categoryId },
  });
  return response.data;
};
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0
