
# ForumLite

ForumLite is a lightweight forum application built using Next.js, TypeScript, Tailwind CSS, ShadCN UI components, and placeholder data for persistence. It demonstrates core forum functionalities including user authentication, category and topic management, posting, an admin panel, user profiles, rich content features, a notification system, and private messaging.

## Features

*   **User Authentication:**
    *   Register, login, and logout functionality.
    *   Secure session management using cookies.
    *   **First User Admin:** The very first user to register on the platform is automatically granted administrator privileges.
*   **Forum Structure:**
    *   Create and manage categories (Admin only for creation/editing).
    *   Users can create topics within categories.
*   **Posting & Interaction:**
    *   Users can create new topics with a title and an initial post.
    *   Users can reply to existing topics.
    *   Post editing and deletion are supported (by author or admin).
    *   "Start a New Topic" button on category pages to toggle the topic creation form, improving UX.
*   **Rich Content Creation & Display:**
    *   **Markdown Support:** Posts are rendered using Markdown, allowing for rich text formatting.
    *   **Rich Text Editor:** A toolbar provides easy access to common Markdown formatting options:
        *   Bold, Italic, Strikethrough.
        *   Links and Images (via URL input).
        *   Blockquotes and Code snippets (with syntax highlighting using `react-syntax-highlighter`).
        *   Bulleted and Numbered lists.
        *   **Emoji Picker:** Integrated emoji support (`emoji-picker-react`) for posts and topic creation.
    *   **Drag-and-Drop Image Uploads:** Users can drag and drop images (or select via file input) when creating the first post of a topic or when replying. Images are handled as data URIs.
    *   **Automatic YouTube Embedding:** Pasting a YouTube video link in a post will automatically embed the video player.
*   **User Profiles (`/users/[username]`):**
    *   Viewable public profiles for each user.
    *   Profile displays:
        *   Username and Avatar (uploadable as data URI, with Vercel Avatars as fallback).
        *   "About Me" section.
        *   Join Date and Post Count.
        *   Optional: Location, Website URL, Social Media Link, Signature.
        *   Last Active timestamp.
    *   **Profile Editing:** Logged-in users can edit their own profiles at `/users/[username]/edit`, including avatar upload and updating personal information. Website and social media links automatically get `https://` prefixed if not present.
*   **Admin Panel (`/admin`):**
    *   **Dashboard:** Overview of forum statistics (total users, categories, topics, posts).
    *   **User Management:** View all users, toggle admin status for users, delete users (admins cannot delete themselves).
    *   **Category Management:** Create new categories, view existing categories, edit category details (name, description), delete categories (which also removes associated topics and posts).
*   **Notifications & Mentions:**
    *   **User Mentions:** Users can mention each other in posts using the "@username" syntax.
    *   **Notification System:** Mentioned users receive notifications.
    *   **Header Dropdown:** A notification icon in the header displays a count of unread notifications and a dropdown with recent notifications (max 5 shown, with link to all).
    *   **Dedicated Notifications Page (`/notifications`):** Users can view all their notifications, sorted by most recent.
    *   **Mark as Read:** Notifications can be marked as read individually or all at once. Clicking a notification also marks it as read.
    *   **Navigation:** Clicking a notification directly navigates the user to the relevant post where the mention occurred.
    *   **Profile Links:** "@username" mentions in posts are automatically linked to the respective user's profile page.
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
    *   **Dynamic Updates:** Message list and counts update dynamically.
*   **Account Settings (`/settings`):**
    *   **Change Password:** Users can update their account password.
    *   Links to manage notifications and private messages.
*   **Dynamic Updates:**
    *   Content (categories, topics, posts, notifications, private messages) updates dynamically after creation, editing, or deletion using Next.js Server Actions and `revalidatePath` for a smooth user experience without manual page refreshes.
*   **Responsive Design:** Built with Tailwind CSS for responsiveness across devices (desktop, tablet, mobile).
*   **Modern UI:** Utilizes ShadCN UI components for a clean, accessible, and modern look and feel.
*   **Server Actions:** Leverages Next.js Server Actions for form submissions and data mutations, reducing the need for traditional API endpoints for these operations.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** ShadCN UI
*   **State Management:** React Hooks (including `useActionState`)
*   **Rich Text & Markdown:**
    *   `react-markdown` for rendering Markdown content.
    *   `remark-gfm` for GitHub Flavored Markdown support (tables, strikethrough, etc.).
    *   `react-syntax-highlighter` for code block syntax highlighting.
    *   `emoji-picker-react` for emoji selection.
*   **Data Persistence:** In-memory placeholder data (`src/lib/placeholder-data.ts`) simulates database interactions.
*   **Date Formatting:** `date-fns` for user-friendly date and time displays.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (Version 18 or later recommended)
*   [npm](https://www.npmjs.com/) (or [yarn](https://yarnpkg.com/))

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
    *This will install all necessary packages including `@tailwindcss/typography` for the Markdown prose styling and other UI/utility libraries.*

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

This command starts the Next.js development server, typically on `http://localhost:9002` (as configured in `package.json`). Open this URL in your web browser to view the application.

## Getting Started

1.  **Register the First User (Admin):** Navigate to the registration page (`/register`). The first account created will automatically have administrative privileges.
2.  **Explore:**
    *   Browse the forum.
    *   Create categories (if logged in as admin via the Admin Panel).
    *   Navigate to a category and click "Start a New Topic" to create discussions.
    *   Reply to topics, try out the rich text editor features (Markdown, image upload, emoji, @mentions).
3.  **Admin Panel:** If logged in as the admin user, access the Admin Panel via the link in the header or by navigating to `/admin`. Here you can manage users and categories.
4.  **User Profiles:** Click on a username (e.g., in a post or a mention) to view their profile. If it's your own profile, you'll see an "Edit Profile" button.
5.  **Notifications:** Try mentioning another user in a post (if you have a second account, or mention yourself to test). Check the notification dropdown in the header and the `/notifications` page.
6.  **Private Messages:**
    *   Navigate to a user's profile and click "Send Message".
    *   Or, go to `/messages` and use the "Start a New Conversation" form.
    *   Explore sending messages, viewing conversation lists, and individual chats.
7.  **Account Settings:** Visit `/settings` to change your password or navigate to your messages/notifications.

## Important Notes & Production Considerations

*   **Password Handling:** For simplicity, passwords are currently stored and compared in plain text within the placeholder data. **This is insecure and should NEVER be done in a production application.** In a real-world scenario, always hash passwords securely (e.g., using `bcrypt`) before storing them.
*   **Error Handling:** Basic error handling is implemented, with messages displayed using toasts. More robust error logging and reporting would be needed for production.
*   **Image Storage:** Uploaded images (avatars, post images) are handled as Base64 data URIs and stored in the in-memory placeholder data. In a production environment, these should be uploaded to a dedicated file storage service (like Cloudinary, AWS S3, Firebase Storage).
*   **Notification & Message Polling:** The notification and private message counts in the header use simple client-side polling for updates. For a production application, a more robust solution like WebSockets or Server-Sent Events would be preferable for real-time updates.

## Data Persistence: Migrating from Placeholder Data to PostgreSQL

This application currently uses in-memory placeholder data (`src/lib/placeholder-data.ts`). **This data is not persistent and will be lost on server restarts.** To enable persistent data storage, you should integrate a real database. The following steps outline how to migrate to PostgreSQL.

### 1. Install Dependencies:
Install the necessary Node.js PostgreSQL client library:
```bash
npm install pg
# If using TypeScript, also install the types:
npm install --save-dev @types/pg
```

### 2. Set up PostgreSQL:
*   **Install PostgreSQL:** If you don't have it already, download and install PostgreSQL from the [official website](https://www.postgresql.org/download/). Follow the instructions for your operating system.
*   **Create a Database User (Recommended):** It's good practice to create a dedicated user for your application with appropriate permissions, rather than using the default superuser.
*   **Create a Database:** Create a new database for your ForumLite application. You can use a tool like `psql` (PostgreSQL's command-line interface) or a GUI tool like pgAdmin.
    Example using `psql`:
    ```sql
    CREATE USER forumlite_user WITH PASSWORD 'your_secure_password';
    CREATE DATABASE forumlite_db OWNER forumlite_user;
    ```

### 3. Configure Environment Variables:
Next.js applications typically use environment variables to store sensitive information like database credentials.

*   **Create a `.env.local` file:** In the root of your project, create a file named `.env.local`. This file is for local development and should **not** be committed to version control (add it to your `.gitignore` file).
    ```
    .env.local
    ```

*   **Add your Database Connection URL:** Inside `.env.local`, add your PostgreSQL connection URL:
    ```env
    DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE_NAME"
    ```
    **Breakdown of the `DATABASE_URL`:**
    *   `postgresql://`: The protocol for PostgreSQL.
    *   `YOUR_USER`: The username you created for your application (e.g., `forumlite_user`).
    *   `YOUR_PASSWORD`: The password for that user. **Make sure this is strong and unique.**
    *   `YOUR_HOST`: The hostname or IP address where your PostgreSQL server is running. For local development, this is usually `localhost`.
    *   `YOUR_PORT`: The port PostgreSQL is listening on. The default is `5432`.
    *   `YOUR_DATABASE_NAME`: The name of the database you created (e.g., `forumlite_db`).

    **Example `.env.local` content:**
    ```env
    DATABASE_URL="postgresql://forumlite_user:your_secure_password@localhost:5432/forumlite_db"
    ```

*   **Accessing Environment Variables in Code:** Next.js automatically loads variables from `.env.local` into `process.env`. You can access `process.env.DATABASE_URL` in your server-side code.

*   **Production Environment Variables:** For deployment (e.g., to Vercel, AWS, Heroku), you will need to configure these environment variables directly in your hosting provider's settings. **Do not commit `.env.local` with production credentials.**

### 4. Define Database Schema and Create Tables:
You'll need to define the structure of your database tables. This involves creating SQL statements for tables like `users`, `categories`, `topics`, `posts`, `notifications`, `conversations`, and `private_messages`, reflecting the structures in `src/lib/types.ts`. Consider using a migration tool (like `node-pg-migrate` or the migration features of an ORM) for managing schema changes over time.

Example (simplified) table creation SQL:
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- Store hashed passwords, not plain text!
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    about_me TEXT,
    location TEXT,
    website_url TEXT,
    social_media_url TEXT,
    signature TEXT,
    last_active TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT
);

-- Add other tables for categories, topics, posts, etc.
-- Remember to include foreign keys and indexes for performance.
```

### 5. Update Data Access Logic:
Modify the functions in `src/lib/placeholder-data.ts` (or create a new module like `src/lib/db.ts`) to interact with your PostgreSQL database instead of the in-memory arrays. You'll use the `pg` library to connect to the database and execute SQL queries.

**Example of a database client setup (e.g., in `src/lib/db.ts`):**
```typescript
// src/lib/db.ts
import { Pool } from 'pg';

let pool: Pool;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add SSL configuration for production if needed
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

// Example function modification:
// export async function findUserByEmail(email: string): Promise<User | null> {
//   const res = await query('SELECT * FROM users WHERE email = $1', [email]);
//   if (res.rows.length === 0) return null;
//   // Map database row to User type (ensure column names match or alias them)
//   const dbUser = res.rows[0];
//   return { /* ... map properties ... */ } as User;
// }
```
You will need to rewrite all functions in `src/lib/placeholder-data.ts` (like `createUser`, `getTopicsByCategory`, etc.) to use SQL queries against your PostgreSQL database.

### 6. (Optional) Use an ORM:
For more complex applications, consider using an Object-Relational Mapper (ORM) like Prisma or TypeORM. ORMs can simplify database interactions, provide type safety, and help with migrations.

This provides a comprehensive guide to transitioning to a persistent PostgreSQL database. Remember that this is a significant change requiring careful implementation of database interactions and security best practices (especially password hashing).

## Project Structure

```
.
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router routes and pages
│   │   ├── admin/      # Admin panel routes and components
│   │   │   ├── categories/ # Admin category specific components
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
│   │   └── page.tsx    # Home page (category list)
│   ├── components/     # Reusable UI components
│   │   ├── forms/      # Form components (Login, Register, Post, Topic, Category, PM etc.)
│   │   │   └── RichTextToolbar.tsx # Toolbar for markdown editing
│   │   ├── forums/     # Forum-specific components (CategoryList, TopicList, Post, PostList)
│   │   ├── layout/     # Layout components (Header, HeaderNotificationDropdown)
│   │   └── ui/         # ShadCN UI components
│   ├── hooks/          # Custom React hooks (useToast, useMobile)
│   ├── lib/            # Core logic, utilities, actions
│   │   ├── actions/    # Server Actions (auth, forums, admin, notifications, privateMessages)
│   │   ├── placeholder-data.ts # In-memory data store and simulation functions
│   │   ├── types.ts    # TypeScript type definitions
│   │   └── utils.ts    # Utility functions (e.g., cn for classnames, parseMentions)
│   └── ai/             # Genkit AI integration files (if used)
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies and scripts
├── tailwind.config.ts  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

This README provides a comprehensive overview of the ForumLite application, its features, setup instructions, and key considerations.
