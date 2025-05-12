
# ForumLite

ForumLite is a lightweight forum application built using Next.js, TypeScript, Tailwind CSS, ShadCN UI components, and placeholder data for persistence. It demonstrates core forum functionalities including user authentication, category and topic management, posting, and an admin panel.

## Features

*   **User Authentication:** Register, login, and logout functionality.
*   **Forum Structure:** Create and manage categories and topics.
*   **Posting:** Users can create new topics and reply to existing ones. Post editing and deletion are supported.
*   **Admin Panel:** Manage users (view, toggle admin status, delete) and categories (create, view, edit, delete). Includes a dashboard with basic statistics.
*   **First User Admin:** The very first user to register on the platform is automatically granted administrator privileges.
*   **Responsive Design:** Built with Tailwind CSS for responsiveness across devices.
*   **Modern UI:** Utilizes ShadCN UI components for a clean and modern look.
*   **Server Actions:** Leverages Next.js Server Actions for form submissions and data mutations.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** ShadCN UI
*   **State Management:** React Hooks (including `useActionState`)
*   **Data Persistence:** In-memory placeholder data (simulates database interactions)

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
2.  **Explore:** Browse the forum, create categories (if logged in as admin), create topics, and post replies.
3.  **Admin Panel:** If logged in as the admin user, access the Admin Panel via the link in the header or by navigating to `/admin`. Here you can manage users and categories.

## Important Notes

*   **Placeholder Data:** This application uses in-memory arrays (`src/lib/placeholder-data.ts`) to simulate a database. **All data will be lost when the development server restarts.** For persistent storage, you would need to integrate a real database (e.g., PostgreSQL, MongoDB, Firebase Firestore).
*   **Password Handling:** For simplicity, passwords are currently stored and compared in plain text within the placeholder data. **This is insecure and should NEVER be done in a production application.** In a real-world scenario, always hash passwords securely (e.g., using `bcrypt`) before storing them.
*   **Error Handling:** Basic error handling is implemented, with messages displayed using toasts. More robust error logging and reporting would be needed for production.

## Project Structure

```
.
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router routes and pages
│   │   ├── admin/      # Admin panel routes and components
│   │   ├── api/        # API routes (if any)
│   │   ├── categories/ # Category-specific pages
│   │   ├── topics/     # Topic-specific pages
│   │   ├── (auth)/     # Route group for auth pages (example)
│   │   ├── globals.css # Global styles and Tailwind directives
│   │   └── layout.tsx  # Root layout
│   │   └── page.tsx    # Home page
│   ├── components/     # Reusable UI components
│   │   ├── forms/      # Form components (Login, Register, Post, etc.)
│   │   ├── forums/     # Forum-specific components (CategoryList, TopicList, etc.)
│   │   ├── layout/     # Layout components (Header, Footer)
│   │   └── ui/         # ShadCN UI components
│   ├── hooks/          # Custom React hooks (useToast, useMobile)
│   ├── lib/            # Core logic, utilities, actions
│   │   ├── actions/    # Server Actions (auth, forums, admin)
│   │   ├── placeholder-data.ts # In-memory data store and simulation functions
│   │   ├── types.ts    # TypeScript type definitions
│   │   └── utils.ts    # Utility functions (e.g., cn for classnames)
│   └── ai/             # Genkit AI integration files (if used)
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies and scripts
├── tailwind.config.ts  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

This README provides a comprehensive overview of the ForumLite application, its features, setup instructions, and key considerations.
