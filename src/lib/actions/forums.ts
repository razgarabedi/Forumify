
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import {
    createCategory as dbCreateCategory,
    createTopic as dbCreateTopic,
    createPost as dbCreatePost,
    updatePost as dbUpdatePost,
    deletePost as dbDeletePost,
    findUserByUsername, 
    createNotification, 
    getTopicByIdSimple,
    getTopicBySlug,
    getTopicById,
    togglePostReaction as dbTogglePostReaction,
    getPostsByTopic as dbGetPostsByTopic, // Import db version
    getCategoryBySlug, 
    getCategoryById,
    getAllSiteSettings
} from "@/lib/db"; // Changed from placeholder-data to db
import { getCurrentUser } from "./auth";
import { parseMentions } from "@/lib/utils"; 
import { checkPermissionForUser, query } from "@/lib/db";
import type { ActionResponse, ReactionType, Post } from "@/lib/types";

// --- Schemas ---
const CategorySchema = z.object({
    name: z.string().min(3, { message: "Category name must be at least 3 characters." }).max(100),
    description: z.string().max(255).optional(),
    type: z.enum(['category','forum']),
    parentId: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.type === 'forum') {
        const isValid = !!data.parentId && data.parentId !== 'none' && z.string().uuid().safeParse(data.parentId).success;
        if (!isValid) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['parentId'], message: 'Forum must have a parent Category.' });
        }
    } else {
        if (data.parentId && data.parentId !== 'none') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['parentId'], message: 'Category cannot have a parent.' });
        }
    }
});

const TopicSchema = z.object({
    title: z.string().min(5, { message: "Topic title must be at least 5 characters." }).max(150),
    categoryId: z.string().min(1, {message: "Category is required."}),
    firstPostContent: z.string().min(10, { message: "First post content must be at least 10 characters." }),
    firstPostImageUrl: z.string().optional(), 
});

const PostSchema = z.object({
    content: z.string().min(10, { message: "Post content must be at least 10 characters." }),
    topicId: z.string().min(1, {message: "Topic ID is required."}),
    postId: z.string().optional(), 
    imageUrl: z.string().optional(), 
    removeImage: z.string().optional(), 
});

const ToggleReactionSchema = z.object({
  postId: z.string().min(1, { message: "Post ID is required."}),
  reactionType: z.enum(['like', 'love', 'haha', 'wow', 'sad', 'angry'], {
    errorMap: () => ({ message: "Invalid reaction type." })
  }),
});


// --- Actions ---

// --- Categories ---
export async function createCategory(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
        return { message: "Unauthorized: Only admins can create categories.", success: false };
    }

    const validatedFields = CategorySchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description"),
        type: formData.get("type"),
        parentId: formData.get("parentId"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to create category.",
            success: false,
        };
    }

    const { name, description, parentId, type } = validatedFields.data;
    const finalParentId = type === 'forum' ? (parentId as string) : null;

    try {
        const newCategory = await dbCreateCategory({ name, description, type, parentId: finalParentId });
        revalidatePath("/"); 
        revalidatePath("/admin/categories"); 
        return { message: `Category "${newCategory.name}" created successfully.`, success: true };
    } catch (error) {
        console.error("Create Category Error:", error);
        return { message: "Database Error: Failed to create category.", success: false };
    }
}

// --- Topics ---
export async function createTopic(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    const user = await getCurrentUser();
    if (!user) {
        return { message: "Unauthorized: You must be logged in to create a topic.", success: false };
    }

     const validatedFields = TopicSchema.safeParse({
        title: formData.get("title"),
        categoryId: formData.get("categoryId"),
        firstPostContent: formData.get("firstPostContent"),
        firstPostImageUrl: formData.get("firstPostImageUrl") || undefined,
    });


     if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to create topic. Check title, category, and first post content.",
            success: false,
        };
    }

    const { title, categoryId, firstPostContent, firstPostImageUrl } = validatedFields.data;

    // Resolve category identifier (UUID or slug) to a UUID for DB operations
    let resolvedCategoryId = categoryId;
    const categoryIdLooksUuid = z.string().uuid().safeParse(categoryId).success;
    if (!categoryIdLooksUuid) {
        const bySlug = await getCategoryBySlug(categoryId);
        if (bySlug) {
            resolvedCategoryId = bySlug.id;
        } else {
            const byId = await getCategoryById(categoryId).catch(() => null);
            if (byId) {
                resolvedCategoryId = byId.id;
            } else {
                return { message: "Invalid or unknown category.", success: false };
            }
        }
    }

    try {
        const newTopic = await dbCreateTopic({
            title,
            categoryId: resolvedCategoryId,
            authorId: user.id,
            firstPostContent,
            firstPostImageUrl: firstPostImageUrl === "" ? undefined : firstPostImageUrl,
        });

        const mentionedUsernames = parseMentions(firstPostContent);
        const uniqueMentionedUserIds = new Set<string>();

        if (mentionedUsernames.length > 0) {
            for (const username of mentionedUsernames) {
                const mentionedUser = await findUserByUsername(username);
                if (mentionedUser && mentionedUser.id !== user.id && !uniqueMentionedUserIds.has(mentionedUser.id)) {
                    const firstPostInTopic = (await dbGetPostsByTopic(newTopic.id))[0];
                    if (firstPostInTopic) {
                        await createNotification({
                            type: 'mention',
                            recipientUserId: mentionedUser.id,
                            senderId: user.id,
                            senderUsername: user.username,
                            postId: firstPostInTopic.id, 
                            topicId: newTopic.id,
                            topicTitle: newTopic.title,
                        });
                        uniqueMentionedUserIds.add(mentionedUser.id);
                    }
                }
            }
        }

        revalidatePath(`/categories/${categoryId}`);
        revalidatePath('/');
        revalidatePath('/notifications', 'layout'); 

        // Get site settings to determine URL format
        const siteSettings = await getAllSiteSettings();
        const topicUrl = siteSettings.seo_friendly_urls_enabled 
            ? `/topics/${newTopic.slug || newTopic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
            : `/topics/${newTopic.id}`;
        
        redirect(topicUrl);
        // Note: redirect will throw an error, so this part might not be reached in happy path.
        // Return type is ActionResponse, but redirect interrups.
        // For consistency, we can return a success object before redirect, but Next.js handles it.
        // return { message: `Topic "${newTopic.title}" created. Redirecting...`, success: true, topicId: newTopic.id };


    } catch (error: any) {
        if (typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        let errorMessage = "Database Error: Failed to create topic.";
        if (error instanceof Error && error.message) {
            errorMessage = `${errorMessage} ${error.message}`;
        }
        return { message: errorMessage, success: false };
    }
}

// --- Posts ---
export async function submitPost(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    const user = await getCurrentUser();
    if (!user) {
        return { message: "Unauthorized: You must be logged in to post.", success: false };
    }

    const validatedFields = PostSchema.safeParse({
        content: formData.get("content"),
        topicId: formData.get("topicId"),
        postId: formData.get("postId") || undefined,
        imageUrl: formData.get("imageUrl") || undefined,
        removeImage: formData.get("removeImage") || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to submit post. Check content length.",
            success: false,
        };
    }

    const { content, topicId, postId } = validatedFields.data;
    const finalImageUrl = validatedFields.data.imageUrl === "" ? undefined : validatedFields.data.imageUrl;
    const removeImage = formData.get("removeImage") === "true";

    try {
        let savedPost: Post | null;
        // Resolve topic identifier (UUID or slug) to a UUID for DB operations
        let resolvedTopicId = topicId;
        const topicIdLooksUuid = z.string().uuid().safeParse(topicId).success;
        if (!topicIdLooksUuid) {
            const bySlug = await getTopicBySlug(topicId);
            if (bySlug) {
                resolvedTopicId = bySlug.id;
            } else {
                const byId = await getTopicById(topicId).catch(() => null);
                if (byId) {
                    resolvedTopicId = byId.id;
                } else {
                    return { message: "Invalid or unknown topic.", success: false };
                }
            }
        }
        if (postId) {
            savedPost = await dbUpdatePost(postId, content, user.id, removeImage ? null : finalImageUrl);
            if (!savedPost) {
                 return { message: "Error: Failed to update post. Post not found or permission denied.", success: false };
            }
        } else {
            savedPost = await dbCreatePost({ content, topicId: resolvedTopicId, authorId: user.id, imageUrl: finalImageUrl });
        }

        if (!savedPost) { // Double check after operations
            return { message: "Error: Failed to save post.", success: false };
        }

        const mentionedUsernames = parseMentions(savedPost.content);
        const uniqueMentionedUserIds = new Set<string>();
        const topicForNotification = await getTopicByIdSimple(resolvedTopicId);

        if (mentionedUsernames.length > 0 && topicForNotification) {
            for (const username of mentionedUsernames) {
                const mentionedUser = await findUserByUsername(username);
                if (mentionedUser && mentionedUser.id !== user.id && !uniqueMentionedUserIds.has(mentionedUser.id)) {
                    await createNotification({
                        type: 'mention',
                        recipientUserId: mentionedUser.id,
                        senderId: user.id,
                        senderUsername: user.username,
                        postId: savedPost.id,
                        topicId: topicId,
                        topicTitle: topicForNotification.title,
                    });
                    uniqueMentionedUserIds.add(mentionedUser.id);
                }
            }
        }

        revalidatePath(`/topics/${topicId}`);
        if (savedPost.topic?.categoryId) {
            revalidatePath(`/categories/${savedPost.topic.categoryId}`);
        }
        revalidatePath('/');
        revalidatePath('/notifications', 'layout'); 

        return { message: postId ? "Post updated successfully." : "Reply posted successfully.", success: true, post: savedPost };

    } catch (error: any) {
        console.error("[Action submitPost] Error:", error);
        const actionType = postId ? 'update' : 'create';
        let errorMessage = `Database Error: Failed to ${actionType} post.`;
        if (error instanceof Error && error.message) {
            errorMessage = `${errorMessage} ${error.message}`;
        }
        return { message: errorMessage, success: false };
    }
}

export async function deletePost(postId: string, topicId: string): Promise<ActionResponse> {
    const user = await getCurrentUser();
     if (!user) {
        return { success: false, message: "Unauthorized: You must be logged in to delete posts."};
    }

    try {
        const success = await dbDeletePost(postId, user.id, user.isAdmin ?? false);
        if (!success) {
             return { success: false, message: "Failed to delete post. Post not found or permission denied."};
        }
        revalidatePath(`/topics/${topicId}`); 

        const topic = await getTopicByIdSimple(topicId);
        if (topic?.categoryId) {
            revalidatePath(`/categories/${topic.categoryId}`);
        }
         revalidatePath('/'); 
         revalidatePath('/admin');
        return { message: "Post deleted successfully.", success: true };
    } catch (error: any) {
        return { success: false, message: (error instanceof Error && error.message) ? error.message : "Database Error: Failed to delete post." };
    }
}

export const getPostsByTopic = async (topicId: string): Promise<Post[]> => {
    return dbGetPostsByTopic(topicId);
}

// --- Reactions ---
export async function toggleReactionAction(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Unauthorized: You must be logged in to react." };
  }

  const validatedFields = ToggleReactionSchema.safeParse({
    postId: formData.get("postId"),
    reactionType: formData.get("reactionType"),
  });

  if (!validatedFields.success) {
    console.log("ToggleReactionAction validation errors:", validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid reaction data.",
      success: false,
    };
  }

  const { postId, reactionType } = validatedFields.data;

  try {
    const updatedPost = await dbTogglePostReaction(postId, user.id, user.username, reactionType as ReactionType);
    if (!updatedPost) {
      return { success: false, message: "Failed to update reaction. Post not found." };
    }
    
    if (updatedPost.authorId !== user.id) {
        const reaction = updatedPost.reactions.find(r => r.userId === user.id && r.type === reactionType);
        const existingReactionInPrevState = prevState?.post?.reactions?.find((r: any) => r.userId === user.id);
        const reactionIsNewOrChanged = !existingReactionInPrevState || existingReactionInPrevState.type !== reactionType;

        if (reaction && reactionIsNewOrChanged) { 
            const topicForNotification = await getTopicByIdSimple(updatedPost.topicId);
            if (topicForNotification) {
                await createNotification({
                    type: 'reaction',
                    recipientUserId: updatedPost.authorId,
                    senderId: user.id,
                    senderUsername: user.username,
                    postId: updatedPost.id,
                    topicId: updatedPost.topicId,
                    topicTitle: topicForNotification.title,
                    reactionType: reactionType,
                });
                revalidatePath('/notifications', 'layout'); 
            }
        }
    }

    const topic = await getTopicByIdSimple(updatedPost.topicId);
    if (topic) {
       revalidatePath(`/topics/${topic.id}`);
    } else {
        console.warn(`[toggleReactionAction] Topic not found for post ${postId}, full revalidation might be needed for related pages.`);
        revalidatePath('/');
    }

    return { success: true, message: "Reaction updated.", post: updatedPost };
  } catch (error: any) {
    console.error("Toggle Reaction Error:", error);
    return { success: false, message: error.message || "Failed to update reaction." };
  }
}

// --- Topic Pinning ---
export async function togglePinTopic(prevState: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized' };
    const topicId = String(formData.get('topicId') || '');
    const pin = String(formData.get('pin') || 'false').toLowerCase() === 'true';
    if (!topicId) return { success: false, message: 'Missing topicId' };
    const canPin = await checkPermissionForUser(user.id, 'pin_topics');
    if (!canPin) return { success: false, message: 'Permission denied' };
    try {
        await query('UPDATE topics SET pinned = $1 WHERE id = $2::uuid', [pin, topicId]);
        revalidatePath('/');
        return { success: true, message: pin ? 'Topic pinned' : 'Topic unpinned' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Failed to update pin' };
    }
}
