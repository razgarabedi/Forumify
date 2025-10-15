# Installation & Setup Guide

This guide will walk you through the complete installation and setup process for ForumLite.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [First Run](#first-run)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before installing ForumLite, ensure you have the following installed:

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or higher | JavaScript runtime |
| npm | 9.x or higher | Package manager |
| PostgreSQL | 12.x or higher | Database |
| Git | Latest | Version control |

### System Requirements

- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 1GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### Check Prerequisites

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check PostgreSQL version
psql --version

# Check Git version
git --version
```

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/forumify.git
cd forumify

# Or if you already have the code
cd /path/to/your/forumify
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# This will install:
# - Next.js framework
# - React components
# - Database drivers
# - UI components (shadcn/ui)
# - Development tools
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env  # or use your preferred editor
```

### 4. Database Setup

#### PostgreSQL Installation

**Windows:**
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer with default settings
3. Remember the password for the `postgres` user

**macOS:**
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE forumify;
CREATE USER forumify_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE forumify TO forumify_user;

# Exit PostgreSQL
\q
```

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://forumify_user:your_secure_password@localhost:5432/forumify"

# Application Configuration
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Email Configuration (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Optional: File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB in bytes

# Optional: Redis Configuration (for caching)
REDIS_URL="redis://localhost:6379"

# Optional: Analytics
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

### Environment Variable Descriptions

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Public URL of your application | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | ✅ | Secret key for authentication | Random 32+ character string |
| `NEXTAUTH_URL` | ✅ | URL for NextAuth.js | `http://localhost:3000` |
| `SMTP_HOST` | ❌ | SMTP server for email notifications | `smtp.gmail.com` |
| `SMTP_PORT` | ❌ | SMTP server port | `587` |
| `SMTP_USER` | ❌ | SMTP username | `your-email@gmail.com` |
| `SMTP_PASS` | ❌ | SMTP password/app password | `your-app-password` |
| `UPLOAD_DIR` | ❌ | Directory for file uploads | `./uploads` |
| `MAX_FILE_SIZE` | ❌ | Maximum file upload size | `10485760` |
| `REDIS_URL` | ❌ | Redis connection for caching | `redis://localhost:6379` |
| `GOOGLE_ANALYTICS_ID` | ❌ | Google Analytics tracking ID | `G-XXXXXXXXXX` |

### Generate Secure Secrets

```bash
# Generate a secure NextAuth secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🗄️ Database Setup

### Automatic Database Initialization

ForumLite will automatically create the necessary database tables on first run:

```bash
# Start the development server
npm run dev

# The application will:
# 1. Connect to the database
# 2. Create tables if they don't exist
# 3. Insert default data
# 4. Set up initial admin user
```

### Manual Database Setup (Optional)

If you prefer to set up the database manually:

```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Database Schema

The application creates the following tables:

- `users` - User accounts and profiles
- `categories` - Forum categories
- `topics` - Discussion topics
- `posts` - Individual posts/replies
- `events` - Events and webinars
- `site_settings` - Application settings
- `notifications` - User notifications
- `private_messages` - Private messaging

## 🎯 First Run

### 1. Start the Development Server

```bash
# Start the development server
npm run dev

# The server will start on http://localhost:3000
```

### 2. Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the ForumLite homepage
3. Click "Register" to create your first user account

### 3. Create Admin Account

The first registered user automatically becomes an admin:

1. Go to `http://localhost:3000/register`
2. Fill in the registration form
3. Complete the registration
4. You'll be redirected to the homepage as an admin

### 4. Access Admin Panel

1. Log in with your admin account
2. Look for the "Admin Panel" link in the navigation
3. Navigate to `http://localhost:3000/admin`

## ✅ Verification

### Check Installation

Run these commands to verify your installation:

```bash
# Check if all dependencies are installed
npm list --depth=0

# Run the build process
npm run build

# Start the production server
npm start
```

### Test Database Connection

```bash
# Test database connection
npm run db:test

# Check database tables
npm run db:status
```

### Verify Features

1. **User Registration**: Create a new user account
2. **Forum Navigation**: Browse categories and topics
3. **Post Creation**: Create a new topic or reply
4. **Admin Panel**: Access admin features
5. **SEO Settings**: Configure SEO in admin panel

## 🔧 Troubleshooting

### Common Installation Issues

#### Node.js Version Issues

**Problem**: `npm install` fails with Node.js version errors.

**Solution**:
```bash
# Check your Node.js version
node --version

# If version is too old, update Node.js
# Visit https://nodejs.org/ and download the latest LTS version
```

#### Database Connection Issues

**Problem**: Application can't connect to PostgreSQL.

**Solution**:
1. Check if PostgreSQL is running:
   ```bash
   # Windows
   services.msc  # Look for PostgreSQL service
   
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verify connection string in `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

3. Test connection manually:
   ```bash
   psql "postgresql://username:password@localhost:5432/database_name"
   ```

#### Port Already in Use

**Problem**: Port 3000 is already in use.

**Solution**:
```bash
# Find what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use a different port
PORT=3001 npm run dev
```

#### Permission Issues

**Problem**: Permission denied errors during installation.

**Solution**:
```bash
# Don't use sudo with npm
# Instead, fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use a Node version manager like nvm
```

### Database Issues

#### Tables Not Created

**Problem**: Database tables are not created automatically.

**Solution**:
1. Check database connection
2. Verify user permissions
3. Run manual migration:
   ```bash
   npm run db:migrate
   ```

#### Initial Data Missing

**Problem**: No default categories or settings.

**Solution**:
```bash
# Seed the database with initial data
npm run db:seed
```

### Development Issues

#### Hot Reload Not Working

**Problem**: Changes not reflected in browser.

**Solution**:
1. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. Check file watching limits:
   ```bash
   # Increase file watching limits (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

#### Build Errors

**Problem**: `npm run build` fails.

**Solution**:
1. Clear all caches:
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

2. Check for TypeScript errors:
   ```bash
   npm run type-check
   ```

### Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](../troubleshooting/common-issues.md)
2. Review application logs in the console
3. Check the [GitHub Issues](https://github.com/yourusername/forumify/issues)
4. Create a new issue with:
   - Your operating system
   - Node.js version
   - Error messages
   - Steps to reproduce

## 📚 Next Steps

After successful installation:

1. **Configure SEO**: Set up [SEO settings](../features/seo.md)
2. **Customize Appearance**: Modify themes and styling
3. **Set Up Email**: Configure SMTP for notifications
4. **Deploy to Production**: Follow the [deployment guide](../deployment/production.md)
5. **Monitor Performance**: Set up logging and monitoring

---

**Last Updated**: December 2024  
**Version**: 1.0.0
