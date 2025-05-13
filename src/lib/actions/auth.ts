
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { 
    findUserByEmail, 
    createUser, 
    findUserById, 
    getAllUsers,
    updateUserProfile, // Added
    updateUserLastActive // Added
} from "@/lib/placeholder-data";
import type { User, ActionResponse } from "@/lib/types";

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

const ProfileUpdateSchema = z.object({
    // avatarUrl can be an HTTP/S URL or a data URI, or empty for removal
    avatarUrl: z.string().optional().refine(val => {
        if (val === undefined || val === '') return true; // Optional or empty string (for removal) is fine
        return val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://');
    }, { message: "Avatar must be a valid image data URI or an HTTP(S) URL." }),
    aboutMe: z.string().max(500, { message: "About me cannot exceed 500 characters." }).optional(),
    location: z.string().max(100, { message: "Location cannot exceed 100 characters." }).optional(),
    websiteUrl: z.string().optional().transform(val => {
        if (val && val.length > 0 && !val.startsWith('http://') && !val.startsWith('https://')) {
            return `https://${val}`;
        }
        return val === '' ? undefined : val; // Ensure empty string becomes undefined if not a valid URL structure
    }).refine(val => {
        if (val === undefined || val === '') return true;
        try {
            new URL(val);
            return true;
        } catch {
            return false;
        }
    }, { message: "Invalid URL format for website." }).optional(),
    socialMediaUrl: z.string().optional().transform(val => {
        if (val && val.length > 0 && !val.startsWith('http://') && !val.startsWith('https://')) {
            return `https://${val}`;
        }
        return val === '' ? undefined : val; // Ensure empty string becomes undefined
    }).refine(val => {
        if (val === undefined || val === '') return true;
        try {
            new URL(val);
            return true;
        } catch {
            return false;
        }
    }, { message: "Invalid URL format for social media." }).optional(),
    signature: z.string().max(150, { message: "Signature cannot exceed 150 characters." }).optional(),
});


// --- Actions ---

export async function login(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Login failed. Please check your inputs.",
      success: false,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const user = await findUserByEmail(email);
    const passwordMatch = user && user.password === password;

    if (!user || !passwordMatch) {
      console.warn(`Login failed for ${email}. User found: ${!!user}, Password match: ${passwordMatch}`);
      return { message: "Invalid email or password.", success: false };
    }

    cookies().set(SESSION_COOKIE_NAME, user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
    await updateUserLastActive(user.id); // Update last active on login

    revalidatePath('/', 'layout');
    return { message: `Welcome back, ${user.username}!`, success: true, user };

  } catch (error) {
    console.error("Login error:", error);
    return { message: "An unexpected error occurred during login.", success: false };
  }
}

export async function register(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
  const validatedFields = RegisterSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Registration failed. Please check your inputs.",
      success: false,
    };
  }

  const { username, email, password } = validatedFields.data;

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return { message: "An account with this email already exists.", success: false };
    }

    const allUsers = await getAllUsers();
    const isFirstUser = allUsers.length === 0;

    const newUser = await createUser({
      username,
      email,
      password: password,
      isAdmin: isFirstUser,
      lastActive: new Date(), // Set last active on registration
    });

     cookies().set(SESSION_COOKIE_NAME, newUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
    await updateUserLastActive(newUser.id); // Update last active on registration login

    revalidatePath('/', 'layout');
    return { message: `Registration successful! Welcome, ${newUser.username}!${isFirstUser ? ' You have been granted admin privileges.' : ''}`, success: true, user: newUser };

  } catch (error) {
    console.error("Registration error:", error);
    return { message: "An unexpected error occurred during registration.", success: false };
  }
}

export async function logout() {
    const user = await getCurrentUser();
    if (user) {
        await updateUserLastActive(user.id); // Update last active on logout
    }
    cookies().delete(SESSION_COOKIE_NAME);
    revalidatePath('/', 'layout');
}

export async function getCurrentUser(): Promise<User | null> {
    const userId = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!userId) {
        return null;
    }
    try {
        const user = await findUserById(userId);
        // if (user) await updateUserLastActive(user.id); // Optionally update last active on every check
        return user;
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}

export async function updateUserProfileAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, message: "Unauthorized: You must be logged in to update your profile." };
    }
    
    const rawData = {
        avatarUrl: formData.get("avatarUrl") || undefined, // This will be data URI or existing URL or empty string
        aboutMe: formData.get("aboutMe") || undefined,
        location: formData.get("location") || undefined,
        websiteUrl: formData.get("websiteUrl") || undefined,
        socialMediaUrl: formData.get("socialMediaUrl") || undefined,
        signature: formData.get("signature") || undefined,
    };

    const validatedFields = ProfileUpdateSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error("Profile Update Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Profile update failed. Please check your inputs.",
            success: false,
        };
    }
    
    // Use validatedFields.data which includes transformed values
    const updateData = validatedFields.data;

    try {
        const updatedUser = await updateUserProfile(user.id, updateData);
        if (!updatedUser) {
            return { success: false, message: "Failed to update profile. User not found." };
        }
        
        revalidatePath(`/users/${user.username}`); 
        revalidatePath(`/users/${user.username}/edit`); 
        revalidatePath('/', 'layout'); 

        return { success: true, message: "Profile updated successfully.", user: updatedUser };
    } catch (error) {
        console.error("Update Profile Error:", error);
        return { success: false, message: "An unexpected error occurred while updating your profile." };
    }
}
