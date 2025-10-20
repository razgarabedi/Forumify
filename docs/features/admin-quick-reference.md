# Admin Panel Quick Reference

## Quick Access Guide

### Dashboard Overview
- **URL**: `/admin`
- **Purpose**: Forum statistics and quick actions
- **Key Metrics**: Users, Categories, Topics, Posts

### User Management
- **URL**: `/admin/users`
- **Key Actions**:
  - Promote/Demote users to/from admin
  - Delete users (with confirmation)
  - Manage user groups
- **Safety**: Admins cannot delete themselves

### Category Management
- **URL**: `/admin/categories`
- **Key Actions**:
  - Create new categories
  - Edit category names/descriptions
  - Delete categories (removes all content)
- **Features**: Hierarchical structure support

### Event Management
- **URL**: `/admin/events`
- **Key Actions**:
  - Create events and webinars
  - Edit event details
  - Delete events
- **Integration**: Automatically shows in homepage widget

### Site Settings
- **URL**: `/admin/site-settings`
- **Key Configurations**:
  - Events widget settings
  - External links (docs, community)
  - Welcome banner
  - Content censorship
  - User registration control

### SEO Settings
- **URL**: `/admin/seo`
- **Key Configurations**:
  - Meta tags (title, description, keywords)
  - Social media integration
  - Analytics tracking
  - Search engine verification
  - Sitemap generation

### Appearance
- **URL**: `/admin/appearance`
- **Key Customizations**:
  - Logo and favicon upload
  - Custom CSS
  - Header/Footer HTML injection
- **File Limits**: 2MB max for images

### Permissions
- **URL**: `/admin/permissions`
- **Key Features**:
  - Create/delete user groups
  - Set global permissions
  - Manage group memberships
- **Note**: System groups cannot be deleted

## Common Tasks

### Making a User Admin
1. Go to `/admin/users`
2. Find the user in the list
3. Click the actions menu (⋮)
4. Select "Promote to Admin"

### Creating a New Category
1. Go to `/admin/categories`
2. Fill in the category form
3. Set name (required) and description (optional)
4. Choose parent category if creating subcategory
5. Click "Create Category"

### Scheduling an Event
1. Go to `/admin/events`
2. Fill in event details:
   - Title (required)
   - Type (Event or Webinar)
   - Date and time
   - Description (optional)
   - Registration link (optional)
3. Click "Create Event"

### Configuring SEO
1. Go to `/admin/seo`
2. Set site title (50-60 characters recommended)
3. Add meta description (150-160 characters)
4. Configure social media settings
5. Add analytics tracking codes
6. Save settings

### Customizing Appearance
1. Go to `/admin/appearance`
2. Upload logo (recommended: 200x60px)
3. Upload favicon (recommended: 32x32px)
4. Add custom CSS if needed
5. Inject tracking scripts in header/footer
6. Save changes

## File Upload Guidelines

### Logo Requirements
- **Format**: PNG, JPG, GIF, WebP
- **Size**: Maximum 2MB
- **Dimensions**: Recommended 200x60px
- **Storage**: Base64 encoded in database

### Favicon Requirements
- **Format**: ICO, PNG, JPG, GIF, WebP
- **Size**: Maximum 2MB
- **Dimensions**: Recommended 32x32px
- **Storage**: Base64 encoded in database

## Validation Rules

### Category Names
- **Length**: 3-100 characters
- **Uniqueness**: Must be unique within parent category
- **Characters**: Alphanumeric, spaces, hyphens allowed

### Event Details
- **Title**: 3-150 characters
- **Time Format**: HH:MM (24-hour format)
- **Date**: Valid date required
- **URL**: Must be valid URL format if provided

### SEO Settings
- **Site Title**: Maximum 60 characters
- **Description**: Maximum 160 characters
- **Keywords**: Maximum 200 characters
- **URLs**: Must be valid URL format

## Security Notes

- All admin actions require admin privileges
- Server-side validation on all inputs
- CSRF protection via Next.js Server Actions
- Confirmation dialogs for destructive actions
- Admins cannot delete their own accounts

## Troubleshooting

### Common Issues
1. **"Permission Denied"**: Check if user has admin status
2. **Upload Fails**: Verify file size (max 2MB) and format
3. **Events Not Showing**: Check widget settings and event dates
4. **SEO Not Working**: Verify meta tag configuration
5. **Custom CSS Issues**: Check CSS syntax and browser console

### Getting Help
1. Check browser console for JavaScript errors
2. Review server logs for backend issues
3. Test with default settings to isolate problems
4. Verify database connectivity
5. Check file permissions for uploads

## Quick Links

- **Dashboard**: `/admin`
- **Users**: `/admin/users`
- **Categories**: `/admin/categories`
- **Events**: `/admin/events`
- **Settings**: `/admin/site-settings`
- **SEO**: `/admin/seo`
- **Appearance**: `/admin/appearance`
- **Permissions**: `/admin/permissions`
- **Back to Forum**: Click "Back to Forum" in admin sidebar

