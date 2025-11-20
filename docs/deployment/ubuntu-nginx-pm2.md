# Deployment Guide: Ubuntu with Nginx and PM2

This guide will help you deploy Rexerium Forum on an Ubuntu server using Nginx as a reverse proxy and PM2 as a process manager.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Application Setup](#application-setup)
4. [Environment Configuration](#environment-configuration)
5. [Building the Application](#building-the-application)
6. [PM2 Configuration](#pm2-configuration)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL/HTTPS Setup](#sslhttps-setup)
9. [Maintenance and Updates](#maintenance-and-updates)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- Ubuntu 20.04 LTS or later
- Root or sudo access
- Domain name (optional, but recommended)
- Basic knowledge of Linux command line

## Server Setup

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js and npm

Rexerium Forum requires Node.js 18.x or later. Install using NodeSource repository:

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE forumify;
CREATE USER forumify_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE forumify TO forumify_user;
\q
```

### 4. Install PM2

```bash
sudo npm install -g pm2
```

### 5. Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Install Git (if not already installed)

```bash
sudo apt install -y git
```

## Application Setup

### 1. Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/forumify
sudo chown $USER:$USER /var/www/forumify
```

### 2. Clone or Upload Application

**Option A: Clone from Git repository**

```bash
cd /var/www/forumify
git clone <your-repository-url> .
```

**Option B: Upload files via SCP/SFTP**

```bash
# From your local machine
scp -r /path/to/forumify/* user@your-server:/var/www/forumify/
```

### 3. Install Dependencies

```bash
cd /var/www/forumify
npm install
```

## Environment Configuration

### 1. Create Environment File

```bash
cd /var/www/forumify
cp .env.example .env
nano .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://forumify_user:your_secure_password@localhost:5432/forumify

# Next.js Configuration
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NODE_ENV=production

# Session Secret (generate a random string)
NEXTAUTH_SECRET=your_random_secret_key_here
NEXTAUTH_URL=https://yourdomain.com

# Optional: Email Configuration (if using email features)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=noreply@yourdomain.com
```

**Generate a secure secret:**

```bash
openssl rand -base64 32
```

### 3. Set File Permissions

```bash
chmod 600 .env
```

## Building the Application

### 1. Build the Application

```bash
cd /var/www/forumify
npm run build
```

This will create an optimized production build in the `.next` directory.

### 2. Verify Build

```bash
# Test the build locally (optional)
npm start
# Press Ctrl+C to stop
```

## PM2 Configuration

### 1. Create PM2 Ecosystem File

Create a file `ecosystem.config.js` in the application root:

```bash
cd /var/www/forumify
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [{
    name: 'forumify',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/forumify',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/forumify-error.log',
    out_file: '/var/log/pm2/forumify-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

### 2. Create PM2 Log Directory

```bash
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

### 3. Start Application with PM2

```bash
cd /var/www/forumify
pm2 start ecosystem.config.js
```

### 4. Save PM2 Configuration

```bash
pm2 save
```

### 5. Setup PM2 Startup Script

```bash
pm2 startup systemd
# Follow the instructions provided by the command
```

### 6. Useful PM2 Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs forumify

# Restart application
pm2 restart forumify

# Stop application
pm2 stop forumify

# Monitor application
pm2 monit
```

## Nginx Configuration

### 1. Create Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/forumify
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;

    # For initial setup, use this configuration:
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase client body size for file uploads
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/forumify-access.log;
    error_log /var/log/nginx/forumify-error.log;
}
```

### 2. Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/forumify /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow 'OpenSSH'
sudo ufw enable
```

## SSL/HTTPS Setup

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to complete the setup. Certbot will automatically configure Nginx for HTTPS.

### 3. Auto-renewal Setup

Certbot automatically sets up a renewal cron job. Test it:

```bash
sudo certbot renew --dry-run
```

### 4. Update Nginx Configuration for HTTPS

After SSL setup, your Nginx configuration should look like this:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 10M;

    access_log /var/log/nginx/forumify-access.log;
    error_log /var/log/nginx/forumify-error.log;
}
```

## Maintenance and Updates

### 1. Updating the Application

```bash
cd /var/www/forumify

# Pull latest changes (if using Git)
git pull origin main

# Install new dependencies
npm install

# Rebuild the application
npm run build

# Restart with PM2
pm2 restart forumify
```

### 2. Database Migrations

```bash
cd /var/www/forumify
npm run db:migrate
```

### 3. Viewing Logs

```bash
# Application logs
pm2 logs forumify

# Nginx access logs
sudo tail -f /var/log/nginx/forumify-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/forumify-error.log

# PM2 logs
tail -f /var/log/pm2/forumify-out.log
tail -f /var/log/pm2/forumify-error.log
```

### 4. Backup Database

```bash
# Create backup
sudo -u postgres pg_dump forumify > /backup/forumify_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
sudo -u postgres psql forumify < /backup/forumify_backup.sql
```

## Troubleshooting

### Application Not Starting

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs forumify
   ```

2. **Check environment variables:**
   ```bash
   cd /var/www/forumify
   cat .env
   ```

3. **Verify database connection:**
   ```bash
   sudo -u postgres psql -d forumify -c "SELECT version();"
   ```

### 502 Bad Gateway Error

1. **Check if application is running:**
   ```bash
   pm2 status
   ```

2. **Check if port 3000 is in use:**
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

3. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/forumify-error.log
   ```

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Test database connection:**
   ```bash
   sudo -u postgres psql -d forumify -U forumify_user
   ```

3. **Check PostgreSQL logs:**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

### High Memory Usage

1. **Monitor with PM2:**
   ```bash
   pm2 monit
   ```

2. **Restart application:**
   ```bash
   pm2 restart forumify
   ```

3. **Adjust PM2 memory limit in `ecosystem.config.js`:**
   ```javascript
   max_memory_restart: '512M'  // Adjust as needed
   ```

### SSL Certificate Issues

1. **Check certificate status:**
   ```bash
   sudo certbot certificates
   ```

2. **Renew certificate manually:**
   ```bash
   sudo certbot renew
   ```

3. **Test renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

## Security Recommendations

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure firewall properly:**
   ```bash
   sudo ufw status
   ```

3. **Use strong database passwords**

4. **Regular backups:**
   - Set up automated database backups
   - Backup application files and configuration

5. **Monitor logs regularly:**
   - Set up log rotation
   - Monitor for suspicious activity

6. **Keep dependencies updated:**
   ```bash
   npm audit
   npm audit fix
   ```

## Performance Optimization

1. **Enable Nginx caching (optional):**
   Add to Nginx configuration:
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=forumify_cache:10m max_size=100m inactive=60m;
   
   location / {
       proxy_cache forumify_cache;
       proxy_cache_valid 200 60m;
       # ... other proxy settings
   }
   ```

2. **Optimize PM2 instances:**
   For multi-core servers, you can use cluster mode:
   ```javascript
   instances: 'max',
   exec_mode: 'cluster'
   ```

3. **Database optimization:**
   - Regular VACUUM and ANALYZE
   - Proper indexing
   - Connection pooling

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## Support

For issues specific to Rexerium Forum, please refer to the main documentation or open an issue on the project repository.

