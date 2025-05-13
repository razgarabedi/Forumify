
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
    togglePostReaction as dbTogglePostReaction,
    getPostsByTopic as dbGetPostsByTopic // Import db version
} from "@/lib/db"; // Changed from placeholder-data to db
import { getCurrentUser } from "./auth";
import { parseMentions } from "@/lib/utils"; 
import type { ActionResponse, ReactionType, Post } from "@/lib/types";

// --- Schemas ---
const CategorySchema = z.object({
    name: z.string().min(3, { message: "Category name must be at least 3 characters." }).max(100),
    description: z.string().max(255).optional(),
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
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to create category.",
            success: false,
        };
    }

    const { name, description } = validatedFields.data;

    try {
        const newCategory = await dbCreateCategory({ name, description });
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

    try {
        const newTopic = await dbCreateTopic({
            title,
            categoryId,
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

        redirect(`/topics/${newTopic.id}`);
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
        if (postId) {
            savedPost = await dbUpdatePost(postId, content, user.id, removeImage ? null : finalImageUrl);
            if (!savedPost) {
                 return { message: "Error: Failed to update post. Post not found or permission denied.", success: false };
            }
        } else {
            savedPost = await dbCreatePost({ content, topicId, authorId: user.id, imageUrl: finalImageUrl });
        }

        if (!savedPost) { // Double check after operations
            return { message: "Error: Failed to save post.", success: false };
        }

        const mentionedUsernames = parseMentions(savedPost.content);
        const uniqueMentionedUserIds = new Set<string>();
        const topicForNotification = await getTopicByIdSimple(topicId);

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
