
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { findUserByEmail, createUser, findUserById, getAllUsers } from "@/lib/placeholder-data"; // Using placeholder
import type { User } from "@/lib/types";

const SESSION_COOKIE_NAME = 'forum_session';

// --- Schemas ---
const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const RegisterSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// --- Actions ---

export async function login(prevState: any, formData: FormData) {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Login failed. Please check your inputs.",
      success: false, // Ensure success is false on validation error
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // Find user by email
    const user = await findUserByEmail(email);
    // console.log('[Login Action] User found by email:', user ? user.id : 'null');

    // **Placeholder Password Check**: Compare plain text passwords stored in placeholder data
    // console.log('[Login Action] Provided Password:', password);
    // console.log('[Login Action] Stored Password:', user?.password);
    const passwordMatch = user && user.password === password; // Critical comparison
    // console.log('[Login Action] Password Match:', passwordMatch);

    if (!user || !passwordMatch) {
      console.warn(`Login failed for ${email}. User found: ${!!user}, Password match: ${passwordMatch}`);
      return { message: "Invalid email or password.", success: false }; // Explicitly set success to false
    }

    // Set session cookie
    cookies().set(SESSION_COOKIE_NAME, user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // One week
        path: '/',
    });

    revalidatePath('/', 'layout'); // Revalidate all pages
    return { message: `Welcome back, ${user.username}!`, success: true, user };

  } catch (error) {
    console.error("Login error:", error);
    return { message: "An unexpected error occurred during login.", success: false }; // Ensure success is false on error
  }
}

export async function register(prevState: any, formData: FormData) {
  const validatedFields = RegisterSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Registration failed. Please check your inputs.",
      success: false, // Ensure success is false on validation error
    };
  }

  const { username, email, password } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return { message: "An account with this email already exists.", success: false }; // Explicitly set success to false
    }

    // Check if this is the first user
    const allUsers = await getAllUsers();
    const isFirstUser = allUsers.length === 0;

    // **IMPORTANT**: In a real app, hash the password before saving!
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the database (using placeholder)
    const newUser = await createUser({
      username,
      email,
      password: password, // Pass plain text password for placeholder
      // passwordHash: hashedPassword, // Store hashed password in real app
      isAdmin: isFirstUser, // Set isAdmin to true if this is the first user
    });

     // Automatically log in the new user by setting the session cookie
     cookies().set(SESSION_COOKIE_NAME, newUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // One week
        path: '/',
    });

    revalidatePath('/', 'layout');
    return { message: `Registration successful! Welcome, ${newUser.username}!${isFirstUser ? ' You have been granted admin privileges.' : ''}`, success: true, user: newUser };

  } catch (error) {
    console.error("Registration error:", error);
    return { message: "An unexpected error occurred during registration.", success: false }; // Ensure success is false on error
  }
}

export async function logout() {
    // Clear the session cookie
    cookies().delete(SESSION_COOKIE_NAME);
    revalidatePath('/', 'layout'); // Revalidate to update UI
}

// Helper to get the current user based on the session cookie
export async function getCurrentUser(): Promise<User | null> {
    const userId = cookies().get(SESSION_COOKIE_NAME)?.value;
    // console.log('[getCurrentUser] Cookie User ID:', userId); // Debug log
    if (!userId) {
        // console.log('[getCurrentUser] No user ID in cookie.'); // Debug log
        return null;
    }
    try {
        // Fetch user from placeholder data store
        const user = await findUserById(userId);
        // console.log('[getCurrentUser] User found by ID:', user ? user.id : 'null'); // Debug log
        // Return the full user object if found, including the password (though usually sensitive data isn't passed around like this)
        return user;
    } catch (error) {
        console.error("Error fetching current user:", error);
        // Optionally clear the cookie if user fetch fails?
        // cookies().delete(SESSION_COOKIE_NAME);
        return null;
    }
}
