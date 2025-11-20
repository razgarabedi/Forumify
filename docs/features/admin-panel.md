# Admin Panel Documentation

## Overview

The Rexerium Forum admin panel provides comprehensive management tools for forum administrators. It features a modern, responsive interface with role-based access control and extensive configuration options.

## Access Control

- **Admin Access**: Only users with `isAdmin: true` can access the admin panel
- **Route Protection**: All admin routes are protected by middleware that redirects unauthorized users
- **Session Management**: Admin status is verified on each request

## Admin Panel Structure

### Navigation Menu

The admin panel features a sidebar navigation with the following sections:

1. **Dashboard** - Overview and statistics
2. **User Management** - User administration and permissions
3. **Category Management** - Forum category organization
4. **Event Management** - Events and webinars
5. **Site Settings** - Core forum configuration
6. **SEO Settings** - Search engine optimization
7. **Appearance** - Visual customization
8. **Permissions** - User groups and access control

## Feature Documentation

### 1. Dashboard (`/admin`)

**Purpose**: Central hub providing forum statistics and quick access to management tools.

**Features**:
- **Statistics Overview**:
  - Total Users count with link to user management
  - Total Categories count with link to category management
  - Total Topics count
  - Total Posts count
- **Version Information**: Current application version display
- **Quick Actions**: Direct links to common administrative tasks
- **Helpful Links**: Configurable documentation and community links

**Data Sources**:
- `getTotalUserCount()` - User statistics
- `getTotalCategoryCount()` - Category statistics
- `getTotalTopicCount()` - Topic statistics
- `getTotalPostCount()` - Post statistics
- `getAllSiteSettings()` - Site configuration

### 2. User Management (`/admin/users`)

**Purpose**: Comprehensive user administration with role management and group assignments.

**Features**:
- **User List View**:
  - Avatar display with profile links
  - Username with profile navigation
  - Email addresses
  - Join dates (formatted)
  - Role badges (Admin/User)
  - Group memberships display
- **User Actions**:
  - **Promote/Demote Admin**: Toggle admin status with confirmation
  - **Manage Groups**: Navigate to user group management
  - **Delete User**: Permanent user deletion with confirmation dialog
- **Safety Features**:
  - Admins cannot delete their own accounts
  - Confirmation dialogs for destructive actions
  - Loading states during operations

**Components**:
- `UserActions.tsx` - Dropdown menu with user management options
- Real-time updates via server actions
- Toast notifications for operation feedback

### 3. Category Management (`/admin/categories`)

**Purpose**: Organize forum structure through category creation and management.

**Features**:
- **Category Creation**:
  - Name and description fields
  - Parent category selection for hierarchical structure
  - Category type specification
- **Category List**:
  - Hierarchical display with parent relationships
  - Topic and post counts per category
  - Creation date tracking
  - Category type indicators
- **Category Actions**:
  - **Edit Category**: Inline editing with modal dialog
  - **Delete Category**: Permanent deletion with confirmation
- **Data Validation**:
  - Name length requirements (3-100 characters)
  - Description length limits (255 characters)
  - Unique name validation

**Components**:
- `CategoryForm.tsx` - Category creation form
- `CategoryActions.tsx` - Category management actions
- Hierarchical category display

### 4. Event Management (`/admin/events`)

**Purpose**: Manage community events and webinars with scheduling and details.

**Features**:
- **Event Creation**:
  - Title and description
  - Event type (Event/Webinar)
  - Date and time scheduling
  - Optional registration links
- **Event List**:
  - Chronological display
  - Type badges (Event/Webinar)
  - Date and time formatting
  - Link management
- **Event Actions**:
  - **Edit Event**: Full event modification
  - **Delete Event**: Permanent removal with confirmation
- **Widget Integration**:
  - Events automatically appear in homepage widget
  - Configurable display settings

**Components**:
- `EventForm.tsx` - Event creation and editing
- `EventActions.tsx` - Event management actions
- Date/time validation and formatting

### 5. Site Settings (`/admin/site-settings`)

**Purpose**: Configure core forum functionality and behavior.

**Features**:
- **Events Widget Configuration**:
  - Enable/disable widget display
  - Position control (above/below categories)
  - Detail level selection (full/compact)
  - Item count configuration (1-10 events)
  - Custom widget title
- **External Links**:
  - Documentation URL configuration
  - Community URL setup
- **Core Settings**:
  - Welcome banner customization
  - Content censorship word list
  - Default discussion sorting (latest/newest/top)
  - User registration control (allow/deny signups)

**Validation**:
- URL format validation for external links
- Character limits for text fields
- Boolean validation for toggles

### 6. SEO Settings (`/admin/seo`)

**Purpose**: Optimize forum for search engines and social media sharing.

**Features**:
- **Basic SEO**:
  - Site title (60 character limit)
  - Meta description (160 character limit)
  - Keywords configuration
- **Social Media Integration**:
  - Open Graph image URL
  - Twitter handle configuration
- **Analytics & Tracking**:
  - Google Analytics ID integration
- **Search Engine Verification**:
  - Google Search Console verification
  - Bing Webmaster Tools verification
- **Advanced Settings**:
  - Custom robots.txt content
  - XML sitemap generation toggle
  - Friendly URL structure toggle

**SEO Features**:
- Automatic meta tag generation
- Sitemap.xml generation at `/sitemap.xml`
- Robots.txt serving at `/robots.txt`
- Social media preview optimization

### 7. Appearance (`/admin/appearance`)

**Purpose**: Customize visual elements and branding.

**Features**:
- **Logo Management**:
  - Logo upload with preview
  - Base64 encoding for storage
  - File size validation (2MB limit)
  - Image format validation
- **Favicon Management**:
  - Favicon upload and preview
  - Multiple format support
- **Custom HTML/JS**:
  - Header injection for analytics scripts
  - Footer injection for widgets
- **Custom CSS**:
  - CSS override system
  - Theme customization support

**File Handling**:
- Client-side image preview
- Base64 encoding for storage
- File type and size validation

### 8. Permissions (`/admin/permissions`)

**Purpose**: Manage user groups and access control permissions.

**Features**:
- **Group Management**:
  - Create custom user groups
  - Delete non-system groups
  - System group protection
- **Permission Grid**:
  - Global permissions management
  - Moderation permissions control
  - Allow/Deny permission states
- **Group Members**:
  - View group membership
  - Member count display
  - System group explanations

**Permission Types**:
- **Global Permissions**: Site-wide access control
- **Moderation Permissions**: Content moderation rights

**Components**:
- `PermissionsForm.tsx` - Comprehensive permission management
- Real-time permission updates
- Group membership visualization

## Technical Implementation

### Server Actions

All admin functionality uses Next.js Server Actions for secure, server-side processing:

- `toggleAdminStatus()` - User role management
- `deleteUserAction()` - User deletion
- `updateCategoryAction()` - Category management
- `deleteCategoryAction()` - Category deletion
- `createEventAction()` - Event creation
- `updateEventAction()` - Event modification
- `deleteEventAction()` - Event deletion
- `updateSiteSettingsAction()` - Site configuration
- `updateSEOSettingsAction()` - SEO configuration
- `updateAppearanceSettingsAction()` - Appearance customization
- `createGroupAction()` - Group creation
- `deleteGroupAction()` - Group deletion
- `setGroupPermissionAction()` - Permission management

### Data Validation

All forms use Zod schema validation:
- Input sanitization
- Type checking
- Length validation
- Format validation (URLs, emails, etc.)
- Required field validation

### Error Handling

- Comprehensive error catching and logging
- User-friendly error messages
- Toast notifications for feedback
- Graceful degradation for failed operations

### Security Features

- Admin privilege verification on all actions
- CSRF protection via Server Actions
- Input sanitization and validation
- SQL injection prevention
- XSS protection through React

## Usage Guidelines

### Best Practices

1. **Regular Backups**: Always backup before major configuration changes
2. **Test Changes**: Test appearance and SEO changes in development first
3. **Monitor Performance**: Watch for performance impact of custom CSS/JS
4. **User Communication**: Inform users of significant changes
5. **Permission Audits**: Regularly review user permissions and groups

### Common Tasks

1. **Adding New Users**: Use User Management to promote users to admin
2. **Organizing Content**: Create categories with clear hierarchy
3. **Event Planning**: Schedule events with proper descriptions and links
4. **SEO Optimization**: Configure meta tags and verification codes
5. **Branding**: Upload logos and customize appearance
6. **Access Control**: Set up user groups with appropriate permissions

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure user has admin status
2. **Upload Failures**: Check file size and format requirements
3. **SEO Not Working**: Verify meta tag configuration and sitemap generation
4. **Events Not Showing**: Check widget configuration and event dates
5. **Custom CSS Issues**: Validate CSS syntax and specificity

### Support

For technical issues:
1. Check browser console for errors
2. Verify server logs for backend issues
3. Test with default settings to isolate problems
4. Review validation error messages
5. Check database connectivity and permissions

## Future Enhancements

Planned features for future releases:
- Bulk user operations
- Advanced analytics dashboard
- Theme marketplace integration
- Advanced permission scoping
- Automated backup system
- Multi-language admin interface
- Advanced moderation tools
- Performance monitoring dashboard