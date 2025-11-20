# Common Issues & Troubleshooting

This guide covers frequently encountered problems and their solutions in Rexerium Forum.

## 📋 Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [SEO Issues](#seo-issues)
- [Admin Panel Issues](#admin-panel-issues)
- [File Upload Issues](#file-upload-issues)
- [Email Issues](#email-issues)
- [Development Issues](#development-issues)

## 🔧 Installation Issues

### Node.js Version Problems

**Problem**: `npm install` fails with Node.js version errors.

**Error Message**:
```
error: This version of Node.js is not supported
```

**Solution**:
```bash
# Check current Node.js version
node --version

# Update to Node.js 18+ LTS
# Visit https://nodejs.org/ and download the latest LTS version

# Or use nvm (Node Version Manager)
nvm install 18
nvm use 18
```

### Package Installation Failures

**Problem**: `npm install` fails with dependency errors.

**Error Message**:
```
npm ERR! peer dep missing
npm ERR! unable to resolve dependency tree
```

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If still failing, try with legacy peer deps
npm install --legacy-peer-deps
```

### Port Already in Use

**Problem**: Port 3000 is already in use.

**Error Message**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions**:
```bash
# Find what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
PORT=3001 npm run dev
```

## 🗄️ Database Issues

### Database Connection Failed

**Problem**: Application can't connect to PostgreSQL.

**Error Message**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions**:

1. **Check PostgreSQL Status**:
   ```bash
   # Windows
   services.msc  # Look for PostgreSQL service
   
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Start PostgreSQL**:
   ```bash
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

3. **Verify Connection String**:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

4. **Test Connection**:
   ```bash
   psql "postgresql://username:password@localhost:5432/database_name"
   ```

### Database Tables Not Created

**Problem**: Database tables are not created automatically.

**Solutions**:
1. **Check Database Permissions**:
   ```sql
   -- Connect as postgres user
   psql -U postgres
   
   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE forumify TO forumify_user;
   ```

2. **Run Manual Migration**:
   ```bash
   npm run db:migrate
   ```

3. **Check Database Status**:
   ```bash
   npm run db:status
   ```

4. **Check Application Logs**:
   ```bash
   # Look for database initialization errors
   tail -f logs/app.log | grep -i database
   ```

### Duplicate Key Errors

**Problem**: Database constraint violations.

**Error Message**:
```
duplicate key value violates unique constraint "users_username_key"
```

**Solutions**:
1. **Check for Duplicate Data**:
   ```sql
   SELECT username, COUNT(*) FROM users GROUP BY username HAVING COUNT(*) > 1;
   ```

2. **Clean Up Duplicates**:
   ```sql
   DELETE FROM users WHERE id NOT IN (
     SELECT MIN(id) FROM users GROUP BY username
   );
   ```

3. **Reset Database** (Development only):
   ```bash
   npm run db:reset
   ```

## 🔐 Authentication Issues

### Login Not Working

**Problem**: Users can't log in with correct credentials.

**Solutions**:
1. **Check Password Hashing**:
   ```bash
   # Verify password is being hashed correctly
   node -e "console.log(require('bcrypt').hashSync('password', 10))"
   ```

2. **Check Session Configuration**:
   ```env
   NEXTAUTH_SECRET="your-32-character-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Clear Browser Cookies**:
   - Clear all cookies for localhost:3000
   - Try incognito/private browsing mode

### Session Expired

**Problem**: Users get logged out frequently.

**Solutions**:
1. **Check Session Settings**:
   ```env
   NEXTAUTH_SESSION_MAX_AGE="30"  # days
   NEXTAUTH_SESSION_UPDATE_AGE="1"  # days
   ```

2. **Verify Cookie Settings**:
   - Check if cookies are being set correctly
   - Verify domain and path settings

### Admin Access Issues

**Problem**: Can't access admin panel.

**Solutions**:
1. **Check User Role**:
   ```sql
   SELECT username, role FROM users WHERE username = 'your_username';
   ```

2. **Promote User to Admin**:
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'your_username';
   ```

## 🚀 Performance Issues

### Slow Page Loading

**Problem**: Pages take too long to load.

**Solutions**:
1. **Check Database Queries**:
   ```bash
   # Enable query logging
   DEBUG=db:* npm run dev
   ```

2. **Optimize Database**:
   ```sql
   -- Add missing indexes
   CREATE INDEX idx_topics_category_id ON topics(category_id);
   CREATE INDEX idx_posts_topic_id ON posts(topic_id);
   ```

3. **Enable Caching**:
   ```env
   REDIS_URL="redis://localhost:6379"
   ```

### Memory Issues

**Problem**: Application uses too much memory.

**Solutions**:
1. **Check Memory Usage**:
   ```bash
   # Monitor memory usage
   top -p $(pgrep node)
   ```

2. **Optimize Queries**:
   - Use pagination for large datasets
   - Limit data loading
   - Use database indexes

3. **Increase Server Memory**:
   ```bash
   # Node.js memory limit
   node --max-old-space-size=4096 server.js
   ```

### Build Performance

**Problem**: `npm run build` is slow.

**Solutions**:
1. **Clear Build Cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Optimize Dependencies**:
   ```bash
   # Remove unused dependencies
   npm prune
   ```

3. **Use Build Optimization**:
   ```javascript
   // next.config.js
   module.exports = {
     experimental: {
       optimizeCss: true,
       optimizePackageImports: ['@/components']
     }
   }
   ```

## 🔍 SEO Issues

### Meta Tags Not Updating

**Problem**: SEO changes not reflected in meta tags.

**Solutions**:
1. **Clear Next.js Cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Check Revalidation**:
   ```typescript
   // Ensure revalidatePath is called after settings update
   revalidatePath('/');
   revalidatePath('/admin/seo');
   ```

3. **Verify Database Connection**:
   ```bash
   # Check if SEO settings are being saved
   npm run db:test
   ```

### Sitemap Not Generating

**Problem**: Sitemap returns 404 or empty content.

**Solutions**:
1. **Check Sitemap Settings**:
   ```sql
   SELECT value FROM site_settings WHERE key = 'seo_sitemap_enabled';
   ```

2. **Verify Route Handler**:
   ```bash
   # Test sitemap endpoint
   curl http://localhost:3000/sitemap.xml
   ```

3. **Check Database Data**:
   ```sql
   -- Verify there's content to include in sitemap
   SELECT COUNT(*) FROM categories;
   SELECT COUNT(*) FROM topics;
   ```

### Structured Data Errors

**Problem**: Google Search Console reports structured data errors.

**Solutions**:
1. **Validate JSON-LD**:
   - Use [Google's Rich Results Test](https://search.google.com/test/rich-results)
   - Check for missing required fields

2. **Fix Schema Issues**:
   ```typescript
   // Ensure all required fields are present
   const structuredData = {
     "@context": "https://schema.org",
     "@type": "WebSite",
     "name": siteSettings.seo_site_title,
     "url": baseUrl
   };
   ```

## 👨‍💼 Admin Panel Issues

### Admin Panel Not Loading

**Problem**: Admin panel shows blank page or errors.

**Solutions**:
1. **Check User Permissions**:
   ```sql
   SELECT role FROM users WHERE id = 'your_user_id';
   ```

2. **Verify Route Access**:
   ```bash
   # Check if admin routes are accessible
   curl -H "Cookie: forum_session=your_session" http://localhost:3000/admin
   ```

3. **Check Console Errors**:
   - Open browser developer tools
   - Look for JavaScript errors
   - Check network requests

### Settings Not Saving

**Problem**: Changes in admin panel not persisting.

**Solutions**:
1. **Check Form Validation**:
   - Verify all required fields are filled
   - Check for validation errors

2. **Check Database Connection**:
   ```bash
   npm run db:test
   ```

3. **Check Server Logs**:
   ```bash
   tail -f logs/app.log | grep -i "admin\|settings"
   ```

## 📁 File Upload Issues

### Upload Failures

**Problem**: File uploads not working.

**Solutions**:
1. **Check Upload Directory**:
   ```bash
   # Verify upload directory exists and is writable
   ls -la uploads/
   chmod 755 uploads/
   ```

2. **Check File Size Limits**:
   ```env
   MAX_FILE_SIZE="10485760"  # 10MB
   ```

3. **Check File Types**:
   ```env
   ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif"
   ```

### File Not Found

**Problem**: Uploaded files return 404.

**Solutions**:
1. **Check File Paths**:
   ```bash
   # Verify file exists
   ls -la uploads/filename.jpg
   ```

2. **Check Static File Serving**:
   ```javascript
   // next.config.js
   module.exports = {
     async rewrites() {
       return [
         {
           source: '/uploads/:path*',
           destination: '/api/uploads/:path*'
         }
       ]
     }
   }
   ```

## 📧 Email Issues

### Emails Not Sending

**Problem**: Email notifications not being sent.

**Solutions**:
1. **Check SMTP Configuration**:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

2. **Test SMTP Connection**:
   ```bash
   # Test SMTP connection
   telnet smtp.gmail.com 587
   ```

3. **Check Email Logs**:
   ```bash
   tail -f logs/email.log
   ```

### Gmail App Password Issues

**Problem**: Gmail authentication fails.

**Solutions**:
1. **Enable 2-Factor Authentication**:
   - Go to Google Account settings
   - Enable 2FA

2. **Generate App Password**:
   - Go to Security settings
   - Generate app password for "Mail"
   - Use app password in SMTP_PASS

## 💻 Development Issues

### Hot Reload Not Working

**Problem**: Changes not reflected in browser.

**Solutions**:
1. **Clear Next.js Cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check File Watching**:
   ```bash
   # Increase file watching limits (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Restart Development Server**:
   ```bash
   # Kill and restart
   pkill -f "next dev"
   npm run dev
   ```

### TypeScript Errors

**Problem**: TypeScript compilation errors.

**Solutions**:
1. **Check Type Definitions**:
   ```bash
   npm run type-check
   ```

2. **Update Dependencies**:
   ```bash
   npm update
   ```

3. **Clear TypeScript Cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

### Build Errors

**Problem**: `npm run build` fails.

**Solutions**:
1. **Clear All Caches**:
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check for TypeScript Errors**:
   ```bash
   npm run type-check
   ```

3. **Check Environment Variables**:
   ```bash
   # Ensure all required env vars are set
   cat .env
   ```

## 🔍 Debugging Tools

### Logging

Enable detailed logging:

```env
# .env
DEBUG=true
LOG_LEVEL=debug
```

### Database Debugging

```bash
# Enable SQL query logging
DEBUG=db:* npm run dev

# Check database connection
npm run db:test

# View database logs
tail -f logs/db.log
```

### Performance Monitoring

```bash
# Monitor memory usage
top -p $(pgrep node)

# Monitor database connections
psql -c "SELECT * FROM pg_stat_activity;"

# Check slow queries
psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## 📞 Getting Help

If you encounter issues not covered here:

1. **Check Application Logs**:
   ```bash
   tail -f logs/app.log
   ```

2. **Search GitHub Issues**:
   - Check existing issues
   - Create new issue with details

3. **Community Support**:
   - Forum discussions
   - Discord community

4. **Professional Support**:
   - Contact support team
   - Enterprise support options

---

**Last Updated**: December 2024  
**Version**: 1.0.0
