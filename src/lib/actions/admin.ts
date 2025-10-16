
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
import { getGroups as dbGetGroups, createGroup as dbCreateGroup, deleteGroup as dbDeleteGroup, getGroupPermissions as dbGetGroupPermissions, setGroupPermission as dbSetGroupPermission } from '@/lib/db';
import type { PermissionKey, PermissionScopeType } from '@/lib/permissions';
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
    parentId: z.string().uuid().optional().nullable(),
});

export async function updateCategoryAction(categoryId: string, data: { name: string; description?: string; parentId?: string | null }): Promise<ActionResponse> {
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
            return { success: false, message: "Validation failed.", errors: Object.fromEntries(
                Object.entries(error.flatten().fieldErrors).filter(([_, value]) => value !== undefined)
            ) as Record<string, string[]> };
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
            return { success: false, message: "Validation failed.", errors: Object.fromEntries(
                Object.entries(validatedFields.error.flatten().fieldErrors).filter(([_, value]) => value !== undefined)
            ) as Record<string, string[]> };
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
            return { success: false, message: "Validation failed.", errors: Object.fromEntries(
                Object.entries(validatedFields.error.flatten().fieldErrors).filter(([_, value]) => value !== undefined)
            ) as Record<string, string[]> };
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
    // External Links
    links_docs_url: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
    links_community_url: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
    // Core Settings
    core_welcome_banner: z.string().max(500, "Welcome banner is too long.").optional().or(z.literal('')),
    core_censor_words: z.string().max(5000, "Censor list too long.").optional().or(z.literal('')),
    core_discussion_sorting: z.enum(['latest','newest','top'] as ['latest'|'newest'|'top', ...('latest'|'newest'|'top')[]]).optional().or(z.literal('')),
    core_allow_signups: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()).optional(),
});

// SEO Settings Schema
const SEOSettingsSchema = z.object({
    seo_site_title: z.string().min(1, "Site title cannot be empty.").max(60, "Site title is too long.").optional().or(z.literal('')),
    seo_site_description: z.string().min(1, "Site description cannot be empty.").max(160, "Site description is too long.").optional().or(z.literal('')),
    seo_site_keywords: z.string().max(200, "Keywords are too long.").optional().or(z.literal('')),
    seo_og_image: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
    seo_twitter_handle: z.string().max(50, "Twitter handle is too long.").optional().or(z.literal('')),
    seo_google_analytics_id: z.string().max(50, "Google Analytics ID is too long.").optional().or(z.literal('')),
    seo_google_site_verification: z.string().max(100, "Google verification code is too long.").optional().or(z.literal('')),
    seo_bing_site_verification: z.string().max(100, "Bing verification code is too long.").optional().or(z.literal('')),
    seo_robots_txt: z.string().max(1000, "Robots.txt content is too long.").optional().or(z.literal('')),
    seo_sitemap_enabled: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()),
    seo_friendly_urls_enabled: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()),
});

// Appearance Settings Schema
const AppearanceSettingsSchema = z.object({
    appearance_logo_url: z.string().max(2000000).optional().or(z.literal('')),
    appearance_favicon_url: z.string().max(2000000).optional().or(z.literal('')),
    appearance_custom_header_html: z.string().max(20000).optional().or(z.literal('')),
    appearance_custom_footer_html: z.string().max(20000).optional().or(z.literal('')),
    appearance_custom_css: z.string().max(50000).optional().or(z.literal('')),
});

export async function updateSiteSettingsAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    // This object will hold the raw values from formData for potential return on error
    const rawDataToReturn = {
        events_widget_enabled: formData.get('events_widget_enabled') ? String(formData.get('events_widget_enabled')) : 'false',
        events_widget_position: formData.get('events_widget_position') as EventWidgetPosition | null,
        events_widget_detail_level: formData.get('events_widget_detail_level') as EventWidgetDetailLevel | null,
        events_widget_item_count: formData.get('events_widget_item_count') as string | null,
        events_widget_title: formData.get('events_widget_title') as string | null,
        links_docs_url: formData.get('links_docs_url') as string | null,
        links_community_url: formData.get('links_community_url') as string | null,
        core_welcome_banner: formData.get('core_welcome_banner') as string | null,
        core_censor_words: formData.get('core_censor_words') as string | null,
        core_discussion_sorting: formData.get('core_discussion_sorting') as string | null,
        core_allow_signups: formData.get('core_allow_signups') ? String(formData.get('core_allow_signups')) : 'false',
    };

    try {
        await checkAdmin();
        
        const validatedFields = SiteSettingsSchema.safeParse(rawDataToReturn);

        if (!validatedFields.success) {
            const fieldErrors = Object.fromEntries(
                Object.entries(validatedFields.error.flatten().fieldErrors).filter(([_, value]) => value !== undefined)
            ) as Record<string, string[]>;
            console.error("Site Settings Validation Errors:", fieldErrors);
            return { 
                success: false, 
                message: "Validation failed for site settings.", 
                errors: fieldErrors,
                rawData: rawDataToReturn 
            };
        }

        const { events_widget_enabled, events_widget_position, events_widget_detail_level, events_widget_item_count, events_widget_title, links_docs_url, links_community_url, core_welcome_banner, core_censor_words, core_discussion_sorting, core_allow_signups } = validatedFields.data;

        await dbUpdateSiteSetting('events_widget_enabled', String(events_widget_enabled));
        await dbUpdateSiteSetting('events_widget_position', events_widget_position);
        await dbUpdateSiteSetting('events_widget_detail_level', events_widget_detail_level);
        await dbUpdateSiteSetting('events_widget_item_count', String(events_widget_item_count));
        await dbUpdateSiteSetting('events_widget_title', events_widget_title || "Upcoming Events & Webinars");
        await dbUpdateSiteSetting('links_docs_url', links_docs_url || "");
        await dbUpdateSiteSetting('links_community_url', links_community_url || "");
        await dbUpdateSiteSetting('core_welcome_banner', core_welcome_banner || "The simple, modern platform for community discussions.");
        await dbUpdateSiteSetting('core_censor_words', core_censor_words || "");
        await dbUpdateSiteSetting('core_discussion_sorting', core_discussion_sorting || 'latest');
        await dbUpdateSiteSetting('core_allow_signups', String(core_allow_signups ?? true));


        revalidatePath('/admin/site-settings');
        revalidatePath('/'); // Revalidate homepage to reflect settings changes
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

export async function updateSEOSettingsAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    // This object will hold the raw values from formData for potential return on error
    const rawDataToReturn = {
        seo_site_title: formData.get('seo_site_title') as string | null,
        seo_site_description: formData.get('seo_site_description') as string | null,
        seo_site_keywords: formData.get('seo_site_keywords') as string | null,
        seo_og_image: formData.get('seo_og_image') as string | null,
        seo_twitter_handle: formData.get('seo_twitter_handle') as string | null,
        seo_google_analytics_id: formData.get('seo_google_analytics_id') as string | null,
        seo_google_site_verification: formData.get('seo_google_site_verification') as string | null,
        seo_bing_site_verification: formData.get('seo_bing_site_verification') as string | null,
        seo_robots_txt: formData.get('seo_robots_txt') as string | null,
        seo_sitemap_enabled: formData.get('seo_sitemap_enabled') ? String(formData.get('seo_sitemap_enabled')) : 'false',
        seo_friendly_urls_enabled: formData.get('seo_friendly_urls_enabled') ? String(formData.get('seo_friendly_urls_enabled')) : 'false',
    };

    try {
        await checkAdmin();
        
        const validatedFields = SEOSettingsSchema.safeParse(rawDataToReturn);

        if (!validatedFields.success) {
            const fieldErrors = Object.fromEntries(
                Object.entries(validatedFields.error.flatten().fieldErrors).filter(([_, value]) => value !== undefined)
            ) as Record<string, string[]>;
            console.error("SEO Settings Validation Errors:", fieldErrors);
            return { 
                success: false, 
                message: "Validation failed for SEO settings.", 
                errors: fieldErrors,
                rawData: rawDataToReturn 
            };
        }

        const { 
            seo_site_title, 
            seo_site_description, 
            seo_site_keywords, 
            seo_og_image, 
            seo_twitter_handle, 
            seo_google_analytics_id, 
            seo_google_site_verification, 
            seo_bing_site_verification, 
            seo_robots_txt, 
            seo_sitemap_enabled,
            seo_friendly_urls_enabled 
        } = validatedFields.data;

        await dbUpdateSiteSetting('seo_site_title', seo_site_title || "ForumLite - Community Discussion Forum");
        await dbUpdateSiteSetting('seo_site_description', seo_site_description || "Join our community forum for engaging discussions, helpful topics, and connecting with like-minded people.");
        await dbUpdateSiteSetting('seo_site_keywords', seo_site_keywords || "forum, community, discussion, topics, posts, social");
        await dbUpdateSiteSetting('seo_og_image', seo_og_image || "");
        await dbUpdateSiteSetting('seo_twitter_handle', seo_twitter_handle || "");
        await dbUpdateSiteSetting('seo_google_analytics_id', seo_google_analytics_id || "");
        await dbUpdateSiteSetting('seo_google_site_verification', seo_google_site_verification || "");
        await dbUpdateSiteSetting('seo_bing_site_verification', seo_bing_site_verification || "");
        await dbUpdateSiteSetting('seo_robots_txt', seo_robots_txt || "User-agent: *\nAllow: /");
        await dbUpdateSiteSetting('seo_sitemap_enabled', String(seo_sitemap_enabled));
        await dbUpdateSiteSetting('seo_friendly_urls_enabled', String(seo_friendly_urls_enabled));

        revalidatePath('/admin/seo');
        revalidatePath('/'); // Revalidate homepage to reflect SEO changes
        return { success: true, message: "SEO settings updated successfully." };

    } catch (error: any) {
        console.error("Update SEO Settings Error:", error);
        return { 
            success: false, 
            message: error.message || "Failed to update SEO settings.",
            rawData: rawDataToReturn 
        };
    }
}

export async function updateAppearanceSettingsAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    const rawDataToReturn = {
        appearance_logo_url: formData.get('appearance_logo_url') as string | null,
        appearance_favicon_url: formData.get('appearance_favicon_url') as string | null,
        appearance_custom_header_html: formData.get('appearance_custom_header_html') as string | null,
        appearance_custom_footer_html: formData.get('appearance_custom_footer_html') as string | null,
        appearance_custom_css: formData.get('appearance_custom_css') as string | null,
    };

    try {
        await checkAdmin();

        const validatedFields = AppearanceSettingsSchema.safeParse(rawDataToReturn);
        if (!validatedFields.success) {
            const fieldErrors = Object.fromEntries(
                Object.entries(validatedFields.error.flatten().fieldErrors).filter(([_, value]) => value !== undefined)
            ) as Record<string, string[]>;
            console.error("Appearance Settings Validation Errors:", fieldErrors);
            return {
                success: false,
                message: "Validation failed for appearance settings.",
                errors: fieldErrors,
                rawData: rawDataToReturn,
            };
        }

        const {
            appearance_logo_url,
            appearance_favicon_url,
            appearance_custom_header_html,
            appearance_custom_footer_html,
            appearance_custom_css,
        } = validatedFields.data;

        await dbUpdateSiteSetting('appearance_logo_url', appearance_logo_url || '');
        await dbUpdateSiteSetting('appearance_favicon_url', appearance_favicon_url || '');
        await dbUpdateSiteSetting('appearance_custom_header_html', appearance_custom_header_html || '');
        await dbUpdateSiteSetting('appearance_custom_footer_html', appearance_custom_footer_html || '');
        await dbUpdateSiteSetting('appearance_custom_css', appearance_custom_css || '');

        revalidatePath('/admin/appearance');
        revalidatePath('/');
        return { success: true, message: 'Appearance settings updated successfully.' };
    } catch (error: any) {
        console.error('Update Appearance Settings Error:', error);
        return {
            success: false,
            message: error.message || 'Failed to update appearance settings.',
            rawData: rawDataToReturn,
        };
    }
}

// --- Groups & Permissions Actions ---
export async function getGroupsAction(): Promise<ActionResponse> {
  try {
    await checkAdmin();
    const groups = await dbGetGroups();
    return { success: true, message: 'ok', groups };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to fetch groups' };
  }
}

export async function createGroupAction(prev: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
  try {
    await checkAdmin();
    const name = String(formData.get('name') || '').trim();
    if (!name) return { success: false, message: 'Group name is required' };
    const group = await dbCreateGroup(name, false);
    revalidatePath('/admin/permissions');
    return { success: true, message: 'Group created', group };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to create group' };
  }
}

export async function deleteGroupAction(groupId: string): Promise<ActionResponse> {
  try {
    await checkAdmin();
    const ok = await dbDeleteGroup(groupId);
    if (!ok) return { success: false, message: 'Cannot delete system group or group not found' };
    revalidatePath('/admin/permissions');
    return { success: true, message: 'Group deleted' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to delete group' };
  }
}

export async function getGroupPermissionsAction(groupId: string): Promise<ActionResponse> {
  try {
    await checkAdmin();
    const permissions = await dbGetGroupPermissions(groupId);
    return { success: true, message: 'ok', permissions };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to fetch permissions' };
  }
}

export async function setGroupPermissionAction(prev: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
  try {
    await checkAdmin();
    const groupId = String(formData.get('groupId'));
    const permission = String(formData.get('permission')) as PermissionKey;
    const allowed = String(formData.get('allowed')).toLowerCase() === 'true';
    const scopeType = (String(formData.get('scopeType') || 'global') as PermissionScopeType);
    const scopeId = (formData.get('scopeId') as string | null) || null;
    if (!groupId || !permission) return { success: false, message: 'Missing groupId or permission' };
    await dbSetGroupPermission(groupId, permission, allowed, scopeType, scopeId);
    revalidatePath('/admin/permissions');
    return { success: true, message: 'Permission updated', groupId, permission, allowed, scopeType, scopeId };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to set permission' };
  }
}
