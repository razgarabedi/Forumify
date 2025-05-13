"use server";

import { revalidatePath } from "next/cache";
import {
    getNotificationsByUserId,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
} from "@/lib/placeholder-data";
import type { Notification, ActionResponse } from "@/lib/types";
import { getCurrentUser } from "./auth";

export async function fetchNotificationsAction(): Promise<Notification[]> {
    const user = await getCurrentUser();
    if (!user) {
        return [];
    }
    return getNotificationsByUserId(user.id);
}

export async function getUnreadNotificationCountAction(): Promise<number> {
    const user = await getCurrentUser();
    if (!user) {
        return 0;
    }
    return getUnreadNotificationCount(user.id);
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResponse> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, message: "Unauthorized." };
    }
    const success = await markNotificationAsRead(notificationId, user.id);
    if (success) {
        revalidatePath('/notifications');
        revalidatePath('/', 'layout'); // For header count update
        return { success: true, message: "Notification marked as read." };
    }
    return { success: false, message: "Failed to mark notification as read." };
}

export async function markAllNotificationsReadAction(): Promise<ActionResponse> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, message: "Unauthorized." };
    }
    const success = await markAllNotificationsAsRead(user.id);
    if (success) {
        revalidatePath('/notifications');
        revalidatePath('/', 'layout'); // For header count update
        return { success: true, message: "All notifications marked as read." };
    }
    // It's not an error if there were no unread notifications to mark
    return { success: true, message: "No unread notifications to mark or operation completed." };
}
