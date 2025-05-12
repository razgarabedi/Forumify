"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { findUserByEmail, createUser, findUserById } from "@/lib/placeholder-data"; // Using placeholder
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
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // **IMPORTANT**: Replace with actual database lookup and password verification (e.g., bcrypt)
    const user = await findUserByEmail(email);

    // **IMPORTANT**: In a real app, compare hashed passwords!
    // const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    const passwordMatch = user ? true : false; // Placeholder: Assume password matches if user exists

    if (!user || !passwordMatch) {
      return { message: "Invalid email or password." };
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
    return { message: "An unexpected error occurred during login." };
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
    };
  }

  const { username, email, password } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return { message: "An account with this email already exists." };
    }

    // **IMPORTANT**: Hash the password before saving!
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the database (using placeholder)
    const newUser = await createUser({
      username,
      email,
      // passwordHash: hashedPassword, // Store hashed password
    });

     // Automatically log in the new user by setting the session cookie
     cookies().set(SESSION_COOKIE_NAME, newUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // One week
        path: '/',
    });

    revalidatePath('/', 'layout');
    return { message: `Registration successful! Welcome, ${newUser.username}!`, success: true, user: newUser };

  } catch (error) {
    console.error("Registration error:", error);
    return { message: "An unexpected error occurred during registration." };
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
    if (!userId) {
        return null;
    }
    try {
        // **IMPORTANT**: Fetch user from your actual database
        const user = await findUserById(userId);
        return user;
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}
