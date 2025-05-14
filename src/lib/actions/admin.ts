
"use server";

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import {
    setUserAdminStatus as dbSetUserAdminStatus,
    deleteUser as dbDeleteUser,
    updateCategory as dbUpdateCategory,
    deleteCategory as dbDeleteCategory,
    createEvent as dbCreateEvent,
    updateEvent as dbUpdateEvent,
    deleteEvent as dbDeleteEvent,
    updateSiteSetting as dbUpdateSiteSetting,
} from '@/lib/db';
import { z } from 'zod';
import type { ActionResponse, EventType, EventWidgetPosition, EventWidgetDetailLevel } from '@/lib/types';

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    throw new Error("Unauthorized: Admin privileges required.");
  }
  return user;
}

export async function toggleAdminStatus(targetUserId: string, newStatus: boolean): Promise<ActionResponse> {
    try {
        await checkAdmin();
        const updatedUser = await dbSetUserAdminStatus(targetUserId, newStatus);
        if (!updatedUser) {
             throw new Error("Failed to update user status. User not found.");
        }
        revalidatePath('/admin/users');
        return { success: true, message: `User status updated successfully.`, newStatus: updatedUser.isAdmin };
    } catch (error: any) {
        console.error("Toggle Admin Status Error:", error);
        return { success: false, message: error.message || "Failed to update user status." };
    }
}

export async function deleteUserAction(targetUserId: string): Promise<ActionResponse> {
     try {
        const adminUser = await checkAdmin();
        if (adminUser.id === targetUserId) {
            throw new Error("Action denied: Admins cannot delete their own account.");
        }

        const success = await dbDeleteUser(targetUserId);
        if (!success) {
             throw new Error("Failed to delete user. User may not exist.");
        }
        revalidatePath('/admin/users');
        revalidatePath('/admin');
        return { success: true, message: "User deleted successfully." };
    } catch (error: any) {
        console.error("Delete User Action Error:", error);
        return { success: false, message: error.message || "Failed to delete user." };
    }
}

const UpdateCategorySchema = z.object({
    name: z.string().min(3, { message: "Category name must be at least 3 characters." }).max(100),
    description: z.string().max(255).optional(),
});

export async function updateCategoryAction(categoryId: string, data: { name: string; description?: string }): Promise<ActionResponse> {
     try {
        await checkAdmin();
        const validatedData = UpdateCategorySchema.parse(data);
        const updatedCategory = await dbUpdateCategory(categoryId, validatedData);
         if (!updatedCategory) {
             throw new Error("Failed to update category. Category not found.");
        }
         revalidatePath('/admin/categories');
         revalidatePath('/');
         revalidatePath(`/categories/${categoryId}`);
        return { success: true, message: "Category updated successfully.", category: updatedCategory };
    } catch (error: any) {
        console.error("Update Category Action Error:", error);
         if (error instanceof z.ZodError) {
            return { success: false, message: "Validation failed.", errors: error.flatten().fieldErrors };
        }
        return { success: false, message: error.message || "Failed to update category." };
    }
}


export async function deleteCategoryAction(categoryId: string): Promise<ActionResponse> {
    try {
        await checkAdmin();
        const success = await dbDeleteCategory(categoryId);
        if (!success) {
            throw new Error("Failed to delete category. Category may not exist.");
        }
        revalidatePath('/admin/categories');
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: "Category deleted successfully." };
    } catch (error: any) {
        console.error("Delete Category Action Error:", error);
        return { success: false, message: error.message || "Failed to delete category." };
    }
}

// --- Event Actions ---
const EventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(150),
  type: z.enum(['event', 'webinar'] as [EventType, ...EventType[]]), // Ensure it's a non-empty array for z.enum
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
  description: z.string().max(500).optional(),
  link: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')), // Allow empty string for optional URL
});

export async function createEventAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    try {
        await checkAdmin();
        const rawData = {
            title: formData.get("title"),
            type: formData.get("type"),
            date: formData.get("date"),
            time: formData.get("time"),
            description: formData.get("description") || undefined,
            link: formData.get("link") || undefined,
        };
        const validatedFields = EventSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return { success: false, message: "Validation failed.", errors: validatedFields.error.flatten().fieldErrors };
        }
        const eventData = {
            ...validatedFields.data,
            date: new Date(validatedFields.data.date),
            link: validatedFields.data.link === '' ? undefined : validatedFields.data.link,
        };
        const newEvent = await dbCreateEvent(eventData);
        revalidatePath('/admin/events');
        revalidatePath('/'); // Revalidate homepage for widget update
        return { success: true, message: "Event created successfully.", event: newEvent };
    } catch (error: any) {
        console.error("Create Event Error:", error);
        return { success: false, message: error.message || "Failed to create event." };
    }
}

export async function updateEventAction(eventId: string, prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    try {
        await checkAdmin();
         const rawData = {
            title: formData.get("title"),
            type: formData.get("type"),
            date: formData.get("date"),
            time: formData.get("time"),
            description: formData.get("description") || undefined,
            link: formData.get("link") || undefined,
        };
        const validatedFields = EventSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return { success: false, message: "Validation failed.", errors: validatedFields.error.flatten().fieldErrors };
        }

        const eventData = {
            ...validatedFields.data,
            date: new Date(validatedFields.data.date),
             link: validatedFields.data.link === '' ? undefined : validatedFields.data.link,
        };
        const updatedEvent = await dbUpdateEvent(eventId, eventData);
        if (!updatedEvent) {
            throw new Error("Failed to update event. Event not found.");
        }
        revalidatePath('/admin/events');
        revalidatePath('/'); // Revalidate homepage for widget update
        return { success: true, message: "Event updated successfully.", event: updatedEvent };
    } catch (error: any) {
        console.error("Update Event Error:", error);
        return { success: false, message: error.message || "Failed to update event." };
    }
}

export async function deleteEventAction(eventId: string): Promise<ActionResponse> {
    try {
        await checkAdmin();
        const success = await dbDeleteEvent(eventId);
        if (!success) {
            throw new Error("Failed to delete event. Event not found.");
        }
        revalidatePath('/admin/events');
        revalidatePath('/'); // Revalidate homepage for widget update
        return { success: true, message: "Event deleted successfully." };
    } catch (error: any) {
        console.error("Delete Event Error:", error);
        return { success: false, message: error.message || "Failed to delete event." };
    }
}

// --- Site Settings Actions ---
const SiteSettingsSchema = z.object({
    events_widget_enabled: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()),
    events_widget_position: z.enum(['above_categories', 'below_categories'] as [EventWidgetPosition, ...EventWidgetPosition[]]),
    events_widget_detail_level: z.enum(['full', 'compact'] as [EventWidgetDetailLevel, ...EventWidgetDetailLevel[]]),
    events_widget_item_count: z.coerce.number().int().min(1, "Must show at least 1 item.").max(10, "Cannot show more than 10 items."),
    events_widget_title: z.string().min(1, "Widget title cannot be empty.").max(100, "Widget title is too long.").optional().or(z.literal('')),
});

export async function updateSiteSettingsAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    // This object will hold the raw values from formData for potential return on error
    const rawDataToReturn = {
        events_widget_enabled: formData.get('events_widget_enabled') ? String(formData.get('events_widget_enabled')) : 'false',
        events_widget_position: formData.get('events_widget_position') as EventWidgetPosition | null,
        events_widget_detail_level: formData.get('events_widget_detail_level') as EventWidgetDetailLevel | null,
        events_widget_item_count: formData.get('events_widget_item_count') as string | null,
        events_widget_title: formData.get('events_widget_title') as string | null,
    };

    try {
        await checkAdmin();
        
        const validatedFields = SiteSettingsSchema.safeParse(rawDataToReturn);

        if (!validatedFields.success) {
            console.error("Site Settings Validation Errors:", validatedFields.error.flatten().fieldErrors);
            return { 
                success: false, 
                message: "Validation failed for site settings.", 
                errors: validatedFields.error.flatten().fieldErrors,
                rawData: rawDataToReturn 
            };
        }

        const { events_widget_enabled, events_widget_position, events_widget_detail_level, events_widget_item_count, events_widget_title } = validatedFields.data;

        await dbUpdateSiteSetting('events_widget_enabled', String(events_widget_enabled));
        await dbUpdateSiteSetting('events_widget_position', events_widget_position);
        await dbUpdateSiteSetting('events_widget_detail_level', events_widget_detail_level);
        await dbUpdateSiteSetting('events_widget_item_count', String(events_widget_item_count));
        await dbUpdateSiteSetting('events_widget_title', events_widget_title || "Upcoming Events & Webinars");


        revalidatePath('/admin/site-settings');
        revalidatePath('/'); // Revalidate homepage to reflect widget changes
        return { success: true, message: "Site settings updated successfully." };

    } catch (error: any) {
        console.error("Update Site Settings Error:", error);
        return { 
            success: false, 
            message: error.message || "Failed to update site settings.",
            rawData: rawDataToReturn 
        };
    }
}
