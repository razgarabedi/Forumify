
# ForumLite

ForumLite is a lightweight forum application built using Next.js, TypeScript, Tailwind CSS, ShadCN UI components, and PostgreSQL for persistence. It demonstrates core forum functionalities including user authentication, category and topic management, posting, an admin panel, user profiles, rich content features, a notification system, private messaging, and an events/webinars system.

## Features

*   **User Authentication:**
    *   Register, login, and logout functionality.
    *   Secure session management using cookies.
    *   **First User Admin:** The very first user to register on the platform is automatically granted administrator privileges.
*   **Forum Structure:**
    *   Create and manage categories (Admin only for creation/editing). Categories display topic count, post count, and last post information.
    *   Users can create topics within categories.
*   **Posting & Interaction:**
    *   Users can create new topics with a title and an initial post.
    *   Users can reply to existing topics.
    *   Post editing and deletion are supported (by author or admin).
    *   "Start a New Topic" button on category pages to toggle the topic creation form, improving UX.
    *   **Reactions:** Users can react to posts with emojis (like, love, haha, wow, sad, angry). Reactions are counted and displayed, and users earn points for reactions on their posts.
*   **Rich Content Creation & Display:**
    *   **Markdown Support:** Posts are rendered using Markdown, allowing for rich text formatting. Advanced HTML tags are also supported via `rehype-raw`.
    *   **Rich Text Editor:** A toolbar provides easy access to common Markdown and HTML formatting options:
        *   Bold, Italic, Strikethrough, Underline.
        *   Links and Images (via URL input).
        *   Blockquotes and Code snippets (with syntax highlighting using `react-syntax-highlighter`).
        *   Bulleted and Numbered lists.
        *   Highlight, Superscript, Subscript.
        *   Text Glow, Text Shadow.
        *   Spoilers.
        *   Text Alignment (Left, Center, Right, Justify).
        *   Floating content (Left, Right).
        *   Table insertion.
        *   **Emoji Picker:** Integrated emoji support (`emoji-picker-react`) for posts and topic creation.
    *   **Pasting Rich Content:** Pasting content from websites or Word documents attempts to preserve formatting (bold, italic, lists, links, headings, basic tables) and embed images (via data URI) by converting HTML to Markdown/HTML.
    *   **Drag-and-Drop Image Uploads:** Users can drag and drop images (or select via file input) when creating the first post of a topic or when replying. Images are handled as data URIs.
    *   **Automatic YouTube Embedding:** Pasting a YouTube video link in a post will automatically embed the video player.
*   **User Profiles (`/users/[username]`):**
    *   Viewable public profiles for each user.
    *   Profile displays:
        *   Username and Avatar (uploadable as data URI, with Vercel Avatars as fallback).
        *   "About Me" section.
        *   Join Date, Post Count, and **Points** (earned from post reactions).
        *   Optional: Location, Website URL, Social Media Link, Signature.
        *   Last Active timestamp.
    *   **Profile Editing:** Logged-in users can edit their own profiles at `/users/[username]/edit`, including avatar upload and updating personal information. Website and social media links automatically get `https://` prefixed if not present.
*   **Admin Panel (`/admin`):**
    *   **Dashboard:** Overview of forum statistics (total users, categories, topics, posts).
    *   **User Management:** View all users, toggle admin status for users, delete users (admins cannot delete themselves).
    *   **Category Management:** Create new categories, view existing categories, edit category details (name, description), delete categories (which also removes associated topics and posts).
    *   **Event Management (`/admin/events`):** Create, view, edit, and delete events or webinars.
    *   **Site Settings (`/admin/site-settings`):** Configure global site features, including:
        *   **Events & Webinars Widget:**
            *   Enable or disable the widget on the homepage.
            *   Set the widget's position (above or below categories).
            *   Choose detail level (full or compact).
            *   Specify the number of events/webinars to display.
            *   Customize the widget title.
*   **Events & Webinars Widget:**
    *   Displays upcoming events and webinars on the homepage.
    *   Appearance and content are controlled via Admin Site Settings.
*   **Notifications & Mentions:**
    *   **User Mentions:** Users can mention each other in posts using the "@username" syntax. Mentions are automatically linked to user profiles.
    *   **Reaction Notifications:** Users receive notifications when someone reacts to their posts.
    *   **Private Message Notifications:** Users receive notifications for new private messages.
    *   **Notification System:** Mentioned users, post authors (for reactions), and PM recipients receive notifications.
    *   **Header Dropdown:** A notification icon in the header displays a count of unread notifications and a dropdown with recent notifications (max 5 shown, with link to all).
    *   **Dedicated Notifications Page (`/notifications`):** Users can view all their notifications, sorted by most recent.
    *   **Mark as Read:** Notifications can be marked as read individually or all at once. Clicking a notification also marks it as read.
    *   **Navigation:** Clicking a notification directly navigates the user to the relevant post, private message, or profile.
*   **Private Messaging (`/messages`):**
    *   **One-on-One Conversations:** Users can engage in private conversations with other users.
    *   **Start New Conversation:**
        *   From the main `/messages` page by entering a username and an optional subject.
        *   Directly from a user's profile page via a "Send Message" button.
    *   **Conversation List:** Displays all user's conversations, sorted by last message activity, showing the other participant, subject (if any), last message snippet, and unread message count.
    *   **Conversation View (`/messages/[conversationId]`):** Displays messages within a specific conversation, with messages from the current user and the other participant styled differently.
    *   **Message Sending:** Form to send new messages within a conversation, supporting Enter to send (Shift+Enter for newline).
    *   **Subject Specificity:** Conversations between the same two users but with different subjects are treated as distinct conversations.
    *   **Unread Indicators:** Unread message count is shown in the header (next to "Messages" link) and for each conversation in the list.
    *   **Automatic Mark as Read:** Messages are marked as read for the current user when a conversation is opened.
*   **Account Settings (`/settings`):**
    *   **Change Password:** Users can update their account password.
    *   Links to manage notifications and private messages.
*   **Dynamic Updates & Real-time Feel:**
    *   Content (categories, topics, posts, notifications, private messages) updates dynamically after creation, editing, or deletion using Next.js Server Actions and `revalidatePath` for a smooth user experience without manual page refreshes.
    *   Notification and private message counts in the header poll for updates, providing a near real-time feel.
*   **Responsive Design & Theming:**
    *   Built with Tailwind CSS for responsiveness across devices (desktop, tablet, mobile).
    *   **Dark Theme by Default:** Features a sleek and clean dark theme as the default, with a theme toggler in the footer to switch to a light theme.
*   **Modern UI:** Utilizes ShadCN UI components for a clean, accessible, and modern look and feel.
*   **Server Actions:** Leverages Next.js Server Actions for form submissions and data mutations, reducing the need for traditional API endpoints for these operations.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Database:** PostgreSQL (with `pg` client)
*   **Styling:** Tailwind CSS
*   **UI Components:** ShadCN UI
*   **State Management:** React Hooks (including `useActionState`)
*   **Rich Text & Markdown:**
    *   `react-markdown` for rendering Markdown content.
    *   `remark-gfm` for GitHub Flavored Markdown support.
    *   `rehype-raw` for rendering HTML within Markdown.
    *   `react-syntax-highlighter` for code block syntax highlighting.
    *   `emoji-picker-react` for emoji selection.
*   **Date Formatting:** `date-fns` for user-friendly date and time displays.
*   **UUID Generation:** `uuid` for generating unique IDs.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (Version 18 or later recommended)
*   [npm](https://www.npmjs.com/) (or [yarn](https://yarnpkg.com/))
*   [PostgreSQL](https://www.postgresql.org/download/) (Install and have a server running)
*   [Nginx](https://nginx.org/en/download.html) (Optional, for production deployment with a reverse proxy)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory-name> # e.g., cd forumlite
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```
    *This will install all necessary packages including `pg` for PostgreSQL, `@tailwindcss/typography` for Markdown prose styling, and other UI/utility libraries.*

## Database Setup & Configuration

This application uses PostgreSQL for data persistence. The `src/lib/db.ts` file contains functions to interact with the database and includes logic to initialize the schema if tables don't exist.

### 1. Detailed PostgreSQL Setup on Ubuntu

If you're on Ubuntu, follow these steps to install and set up PostgreSQL:

*   **Update package lists:**
    ```bash
    sudo apt update
    ```
*   **Install PostgreSQL and its client:**
    ```bash
    sudo apt install postgresql postgresql-contrib
    ```
*   **Verify installation and service status:**
    ```bash
    sudo systemctl status postgresql
    ```
    It should show "active (running)". If not, start it with `sudo systemctl start postgresql`.
*   **Switch to the `postgres` user:**
    By default, PostgreSQL creates a user named `postgres` with superuser privileges.
    ```bash
    sudo -i -u postgres
    ```
*   **Access the PostgreSQL prompt (`psql`):**
    ```bash
    psql
    ```
*   **Create a new database user (Role):**
    It's good practice to create a dedicated user for your application. Replace `forumlite_user` and `your_secure_password` with your desired username and a strong password.
    ```sql
    CREATE USER forumlite_user WITH PASSWORD 'your_secure_password';
    ```
*   **Create a new database:**
    Replace `forumlite_db` with your desired database name. Assign the user you just created as the owner.
    ```sql
    CREATE DATABASE forumlite_db OWNER forumlite_user;
    ```
*   **Grant privileges (optional, if owner is not sufficient for all operations):**
    If you need to grant all privileges on the database to the user:
    ```sql
    GRANT ALL PRIVILEGES ON DATABASE forumlite_db TO forumlite_user;
    ```
*   **Exit `psql` and the `postgres` user session:**
    In `psql`:
    ```sql
    \q
    ```
    Then type `exit` to return to your regular user.

Your PostgreSQL server is now running, and you have a database and user ready for ForumLite.

### 2. Configure Environment Variables

*   In the root of your project, create a file named `.env.local` (if it doesn't exist).
*   Add your PostgreSQL connection URL to `.env.local`:
    ```env
    DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE_NAME"
    ```
    Replace the placeholders:
    *   `YOUR_USER`: Your PostgreSQL username (e.g., `forumlite_user`).
    *   `YOUR_PASSWORD`: The password for that user (e.g., `your_secure_password`).
    *   `YOUR_HOST`: The hostname or IP address of your PostgreSQL server (e.g., `localhost` if running on the same machine).
    *   `YOUR_PORT`: The port PostgreSQL is listening on (default is `5432`).
    *   `YOUR_DATABASE_NAME`: The name of the database you created (e.g., `forumlite_db`).

    **Example `.env.local` content based on the Ubuntu setup above:**
    ```env
    DATABASE_URL="postgresql://forumlite_user:your_secure_password@localhost:5432/forumlite_db"
    ```
*   **Important:** Add `.env.local` to your `.gitignore` file to prevent committing sensitive credentials.
    ```
    # .gitignore
    .env.local
    ```
*   **If `DATABASE_URL` is not set or invalid:** The application will fall back to using in-memory placeholder data (`src/lib/placeholder-data.ts`). This data is **not persistent** and will be lost on server restarts. This fallback is primarily for initial development or demonstration if a database is not immediately available. **For production, a valid `DATABASE_URL` is required.**

### 3. Database Schema Initialization

The application includes logic in `src/lib/db.ts` to automatically create the necessary tables if they don't exist when the application starts (assuming a valid `DATABASE_URL` is provided and the database is accessible). This includes tables for `users`, `categories`, `topics`, `posts`, `reactions`, `notifications`, `conversations`, `private_messages`, `events`, and `site_settings`. No manual schema creation is needed after configuring `DATABASE_URL`.

If the database is new and empty (no `users` table), the `initializeDatabase` function in `src/lib/db.ts` will also attempt to create a default admin user and some initial categories and topics.

## Running the Development Server

To start the development server:

Using npm:
```bash
npm run dev
```
Or using yarn:
```bash
yarn dev
```

This command starts the Next.js development server, typically on `http://localhost:9002` (as configured in `package.json`). Open this URL in your web browser to view the application. The database tables will be initialized automatically on the first run if they don't exist (assuming `DATABASE_URL` is correctly set).

## Production Deployment with Nginx

For production, you'll want to build the Next.js application and run it as a standalone server, often behind a reverse proxy like Nginx.

### 1. Build the Application
```bash
npm run build
```
This creates an optimized production build in the `.next` directory.

### 2. Start the Production Server
```bash
npm start
```
This command starts the Next.js production server, typically listening on port 3000 by default (or port 9002 if `package.json`'s `start` script is `next start -p 9002`). Note the port it's running on.

### 3. Install Nginx (on Ubuntu)
If you don't have Nginx installed:
```bash
sudo apt update
sudo apt install nginx
```
Start and enable Nginx:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Configure Nginx as a Reverse Proxy
Create a new Nginx server block configuration file for your application. For example, `/etc/nginx/sites-available/forumlite`:
```bash
sudo nano /etc/nginx/sites-available/forumlite
```

Paste the following configuration, adjusting `server_name` to your domain (or IP address) and `proxy_pass` to the port your Next.js app is running on (e.g., `http://localhost:9002`):

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name your_domain.com www.your_domain.com; # Replace with your domain or IP

    # Path for SSL certificates (if using Let's Encrypt, this will be added later)
    # ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;
    # include /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Logging
    access_log /var/log/nginx/forumlite.access.log;
    error_log /var/log/nginx/forumlite.error.log;

    location / {
        proxy_pass http://localhost:9002; # Adjust port if your Next.js app runs on a different one
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: Specific handling for Next.js static assets for better caching
    location /_next/static {
        proxy_cache_bypass 1;
        proxy_no_cache 1;
        expires off;
        proxy_pass http://localhost:9002/_next/static; # Adjust port
    }
}
```

### 5. Enable the Nginx Site and Test Configuration
*   Create a symbolic link to enable the site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/forumlite /etc/nginx/sites-enabled/
    ```
*   Test the Nginx configuration for syntax errors:
    ```bash
    sudo nginx -t
    ```
    If it shows "syntax is ok" and "test is successful", proceed.

### 6. Reload Nginx
```bash
sudo systemctl reload nginx
```

### 7. Configure Firewall (if using ufw)
Allow HTTP and HTTPS traffic:
```bash
sudo ufw allow 'Nginx Full'
```

### 8. (Recommended) Setup SSL with Let's Encrypt
For a production site, you should use HTTPS.
*   Install Certbot:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    ```
*   Obtain and install an SSL certificate:
    ```bash
    sudo certbot --nginx -d your_domain.com -d www.your_domain.com
    ```
    Follow the prompts. Certbot will automatically update your Nginx configuration for SSL.
*   Certbot will also set up automatic renewal. You can test renewal with:
    ```bash
    sudo certbot renew --dry-run
    ```

Your ForumLite application should now be accessible via your domain, served by Nginx with the Next.js application running in the background. Consider using a process manager like PM2 to keep your `npm start` process running reliably.

## Getting Started

1.  **Register the First User (Admin):** Navigate to the registration page (`/register`). The first account created will automatically have administrative privileges.
2.  **Default Admin Credentials (if DB was initialized empty):** If the database was empty upon first application start and the automatic schema initialization created the default admin user, you can log in with:
    *   **Email:** `admin@forumlite.com`
    *   **Password:** `password123`
    *   It is **highly recommended** to change this password immediately after logging in.
3.  **Explore:**
    *   Browse the forum. Check out the Events & Webinars widget on the homepage.
    *   Create categories (if logged in as admin via the Admin Panel).
    *   Navigate to a category and click "Start a New Topic" to create discussions.
    *   Reply to topics, try out the rich text editor features (Markdown, HTML tags, image upload, emoji, @mentions, reactions).
4.  **Admin Panel:** If logged in as the admin user, access the Admin Panel via the link in the header or by navigating to `/admin`. Here you can manage users, categories, events, and site settings.
5.  **User Profiles:** Click on a username (e.g., in a post or a mention) to view their profile. If it's your own profile, you'll see an "Edit Profile" button. Check out their post count and points.
6.  **Notifications:** Try mentioning another user in a post or reacting to someone's post. Check the notification dropdown in the header and the `/notifications` page.
7.  **Private Messages:**
    *   Navigate to a user's profile and click "Send Message".
    *   Or, go to `/messages` and use the "Start a New Conversation" form.
    *   Explore sending messages, viewing conversation lists, and individual chats.
8.  **Account Settings:** Visit `/settings` to change your password or navigate to your messages/notifications.
9.  **Theme Toggler:** Check out the theme toggler in the footer to switch between dark (default) and light modes.

## Important Notes & Production Considerations

*   **Password Handling:** For simplicity, passwords are currently stored and compared in plain text within the database in the placeholder version. **This is insecure and should NEVER be done in a production application.** The PostgreSQL version expects password hashing to be implemented (currently, it stores them as-is if not hashed beforehand). In a real-world scenario, always hash passwords securely (e.g., using `bcrypt`) before storing them. The `src/lib/db.ts` file has comments indicating where hashing should be implemented.
*   **Error Handling:** Basic error handling is implemented, with messages displayed using toasts. More robust error logging and reporting would be needed for production.
*   **Image Storage:** Uploaded images (avatars, post images) are handled as Base64 data URIs and stored directly in the database. In a production environment, these should ideally be uploaded to a dedicated file storage service (like Cloudinary, AWS S3, Firebase Storage) to avoid bloating the database and improve performance.
*   **Notification & Message Polling:** The notification and private message counts in the header use simple client-side polling for updates. For a production application, a more robust solution like WebSockets or Server-Sent Events would be preferable for real-time updates.
*   **Database Migrations:** The current automatic table creation in `src/lib/db.ts` is suitable for development. For production, a proper database migration tool (e.g., `node-pg-migrate`, Prisma Migrate, TypeORM migrations) should be used to manage schema changes version control.

## Database Schema Overview (PostgreSQL)

The `src/lib/db.ts` file initializes the following tables if they don't exist (when `DATABASE_URL` is configured):

*   **`users`**: Stores user information including credentials (password should be hashed in production), profile details, admin status, points, etc.
    *   `id` (TEXT PRIMARY KEY)
    *   `username` (TEXT NOT NULL UNIQUE)
    *   `email` (TEXT NOT NULL UNIQUE)
    *   `password_hash` (TEXT NOT NULL)
    *   `is_admin` (BOOLEAN DEFAULT FALSE)
    *   `created_at` (TIMESTAMPTZ)
    *   `about_me`, `location`, `website_url`, `social_media_url`, `signature` (TEXT)
    *   `last_active` (TIMESTAMPTZ)
    *   `avatar_url` (TEXT)
    *   `points` (INTEGER DEFAULT 0)
*   **`categories`**: Stores forum categories.
    *   `id` (TEXT PRIMARY KEY)
    *   `name` (TEXT NOT NULL UNIQUE)
    *   `description` (TEXT)
    *   `created_at` (TIMESTAMPTZ)
*   **`topics`**: Stores forum topics, linked to categories and users.
    *   `id` (TEXT PRIMARY KEY)
    *   `title` (TEXT NOT NULL)
    *   `category_id` (TEXT REFERENCES categories(id) ON DELETE CASCADE)
    *   `author_id` (TEXT REFERENCES users(id) ON DELETE SET NULL)
    *   `created_at` (TIMESTAMPTZ)
    *   `last_activity` (TIMESTAMPTZ)
*   **`posts`**: Stores individual posts within topics, linked to users.
    *   `id` (TEXT PRIMARY KEY)
    *   `content` (TEXT NOT NULL)
    *   `topic_id` (TEXT REFERENCES topics(id) ON DELETE CASCADE)
    *   `author_id` (TEXT REFERENCES users(id) ON DELETE SET NULL)
    *   `created_at` (TIMESTAMPTZ)
    *   `updated_at` (TIMESTAMPTZ)
    *   `image_url` (TEXT)
*   **`reactions`**: Stores user reactions to posts.
    *   `id` (SERIAL PRIMARY KEY)
    *   `post_id` (TEXT REFERENCES posts(id) ON DELETE CASCADE)
    *   `user_id` (TEXT REFERENCES users(id) ON DELETE CASCADE)
    *   `type` (TEXT NOT NULL) -- e.g., 'like', 'love'
    *   `created_at` (TIMESTAMPTZ)
    *   UNIQUE constraint on `(post_id, user_id)`
*   **`notifications`**: Stores notifications for users.
    *   `id` (TEXT PRIMARY KEY)
    *   `type` (TEXT NOT NULL) -- 'mention', 'private_message', 'reaction'
    *   `recipient_user_id` (TEXT REFERENCES users(id) ON DELETE CASCADE)
    *   `sender_id` (TEXT REFERENCES users(id) ON DELETE CASCADE)
    *   `post_id` (TEXT REFERENCES posts(id) ON DELETE CASCADE)
    *   `topic_id` (TEXT REFERENCES topics(id) ON DELETE CASCADE)
    *   `topic_title` (TEXT)
    *   `conversation_id` (TEXT) -- For PM notifications
    *   `reaction_type` (TEXT) -- For reaction notifications
    *   `created_at` (TIMESTAMPTZ)
    *   `is_read` (BOOLEAN DEFAULT FALSE)
    *   `message` (TEXT) -- Snippet for PMs
*   **`conversations`**: Stores metadata for private message conversations.
    *   `id` (TEXT PRIMARY KEY) -- Deterministic based on participants and optional subject
    *   `participant_ids` (TEXT[] NOT NULL) -- Array of user IDs
    *   `subject` (TEXT)
    *   `created_at` (TIMESTAMPTZ)
    *   `last_message_at` (TIMESTAMPTZ)
    *   `last_message_snippet` (TEXT)
    *   `last_message_sender_id` (TEXT REFERENCES users(id) ON DELETE SET NULL)
*   **`private_messages`**: Stores individual private messages within conversations.
    *   `id` (TEXT PRIMARY KEY)
    *   `conversation_id` (TEXT REFERENCES conversations(id) ON DELETE CASCADE)
    *   `sender_id` (TEXT REFERENCES users(id) ON DELETE CASCADE)
    *   `content` (TEXT NOT NULL)
    *   `created_at` (TIMESTAMPTZ)
    *   `read_by` (TEXT[] DEFAULT '{}') -- Array of user IDs who have read the message
*   **`events`**: Stores event and webinar details.
    *   `id` (TEXT PRIMARY KEY)
    *   `title` (TEXT NOT NULL)
    *   `type` (TEXT NOT NULL) -- 'event' or 'webinar'
    *   `date` (DATE NOT NULL)
    *   `time` (TEXT NOT NULL) -- e.g., "14:00"
    *   `description` (TEXT)
    *   `link` (TEXT)
    *   `created_at` (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)
*   **`site_settings`**: Stores global site configuration options.
    *   `key` (TEXT PRIMARY KEY)
    *   `value` (TEXT)

Refer to `src/lib/db.ts` for the exact `CREATE TABLE IF NOT EXISTS` statements used for initialization.

## Project Structure

```
.
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router routes and pages
│   │   ├── admin/      # Admin panel routes and components
│   │   │   ├── categories/ # Admin category specific components
│   │   │   ├── events/     # Admin event specific components
│   │   │   ├── site-settings/ # Admin site settings components
│   │   │   └── users/      # Admin user specific components
│   │   ├── categories/ # Category-specific pages
│   │   │   └── [categoryId]/
│   │   │       └── _components/ # Category page specific components (e.g., CreateTopicControl)
│   │   ├── messages/   # Private messaging pages and components
│   │   │   ├── [conversationId]/
│   │   │   │   └── _components/ # Specific conversation view components
│   │   │   └── _components/     # General messaging components (list, forms)
│   │   ├── notifications/ # Notifications page and components
│   │   │   └── _components/
│   │   ├── settings/   # User account settings page
│   │   ├── topics/     # Topic-specific pages
│   │   │   └── [topicId]/
│   │   ├── users/      # User profile pages
│   │   │   ├── [username]/
│   │   │   │   └── edit/      # Profile edit page
│   │   │   │   └── page.tsx   # Profile view page
│   │   ├── login/
│   │   ├── register/
│   │   ├── globals.css # Global styles and Tailwind directives
│   │   └── layout.tsx  # Root layout
│   │   └── page.tsx    # Home page (category list & events widget)
│   ├── components/     # Reusable UI components
│   │   ├── forms/      # Form components (Login, Register, Post, Topic, Category, PM etc.)
│   │   │   └── RichTextToolbar.tsx # Toolbar for markdown/HTML editing
│   │   ├── forums/     # Forum-specific components (CategoryList, TopicList, Post, PostList, ReactionButtons)
│   │   ├── layout/     # Layout components (Header, Footer, HeaderNotificationDropdown, ThemeToggler)
│   │   ├── ui/         # ShadCN UI components
│   │   └── widgets/    # Site-wide widgets (e.g., EventsWidget)
│   ├── hooks/          # Custom React hooks (useToast, useMobile)
│   ├── lib/            # Core logic, utilities, actions
│   │   ├── actions/    # Server Actions (auth, forums, admin, notifications, privateMessages)
│   │   ├── db.ts       # PostgreSQL database interaction functions
│   │   ├── placeholder-data.ts # In-memory data store (used as fallback if DB fails)
│   │   ├── types.ts    # TypeScript type definitions
│   │   └── utils.ts    # Utility functions (e.g., cn for classnames, parseMentions)
│   └── ai/             # Genkit AI integration files (if used)
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies and scripts
├── tailwind.config.ts  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

This README provides a comprehensive overview of the ForumLite application, its features, setup instructions, and key considerations.
