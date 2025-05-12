"use server";

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import {
    setUserAdminStatus as dbSetUserAdminStatus,
    deleteUser as dbDeleteUser,
    updateCategory as dbUpdateCategory,
    deleteCategory as dbDeleteCategory
} from '@/lib/placeholder-data';
import { z } from 'zod';

// Helper function to check admin privileges
async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    throw new Error("Unauthorized: Admin privileges required.");
  }
  return user;
}

// --- User Actions ---

export async function toggleAdminStatus(targetUserId: string, newStatus: boolean) {
    try {
        await checkAdmin(); // Ensure current user is admin
        const updatedUser = await dbSetUserAdminStatus(targetUserId, newStatus);
        if (!updatedUser) {
             throw new Error("Failed to update user status. User not found.");
        }
        revalidatePath('/admin/users');
        return { success: true, message: `User status updated successfully.`, newStatus };
    } catch (error: any) {
        console.error("Toggle Admin Status Error:", error);
        return { success: false, message: error.message || "Failed to update user status." };
    }
}

export async function deleteUserAction(targetUserId: string) {
     try {
        const adminUser = await checkAdmin(); // Ensure current user is admin
        if (adminUser.id === targetUserId) {
            throw new Error("Action denied: Admins cannot delete their own account.");
        }

        const success = await dbDeleteUser(targetUserId);
        if (!success) {
             throw new Error("Failed to delete user. User may not exist.");
        }
        revalidatePath('/admin/users');
        revalidatePath('/admin'); // Revalidate dashboard counts
        return { success: true, message: "User deleted successfully." };
    } catch (error: any) {
        console.error("Delete User Action Error:", error);
        return { success: false, message: error.message || "Failed to delete user." };
    }
}


// --- Category Actions ---

const UpdateCategorySchema = z.object({
    name: z.string().min(3, { message: "Category name must be at least 3 characters." }).max(100),
    description: z.string().max(255).optional(),
});

// Note: We might want a separate action for the form submission if using useActionState
// For direct calls (e.g., from a modal), this function is fine.
export async function updateCategoryAction(categoryId: string, data: { name: string; description?: string }) {
     try {
        await checkAdmin();
        const validatedData = UpdateCategorySchema.parse(data); // Validate input data
        const updatedCategory = await dbUpdateCategory(categoryId, validatedData);
         if (!updatedCategory) {
             throw new Error("Failed to update category. Category not found.");
        }
         revalidatePath('/admin/categories');
         revalidatePath('/'); // Revalidate homepage
         revalidatePath(`/categories/${categoryId}`); // Revalidate specific category page
        return { success: true, message: "Category updated successfully.", category: updatedCategory };
    } catch (error: any) {
        console.error("Update Category Action Error:", error);
         if (error instanceof z.ZodError) {
            return { success: false, message: "Validation failed.", errors: error.flatten().fieldErrors };
        }
        return { success: false, message: error.message || "Failed to update category." };
    }
}


export async function deleteCategoryAction(categoryId: string) {
    try {
        await checkAdmin();
        const success = await dbDeleteCategory(categoryId);
        if (!success) {
            throw new Error("Failed to delete category. Category may not exist.");
        }
        revalidatePath('/admin/categories');
        revalidatePath('/admin'); // Revalidate dashboard counts
        revalidatePath('/'); // Revalidate homepage
        return { success: true, message: "Category deleted successfully." };
    } catch (error: any) {
        console.error("Delete Category Action Error:", error);
        return { success: false, message: error.message || "Failed to delete category." };
    }
}