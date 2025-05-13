"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import {
    createCategory as dbCreateCategory,
    createTopic as dbCreateTopic,
    createPost as dbCreatePost,
    updatePost as dbUpdatePost,
    deletePost as dbDeletePost
} from "@/lib/placeholder-data"; // Using placeholder functions
import { getCurrentUser } from "./auth";

// --- Schemas ---
const CategorySchema = z.object({
    name: z.string().min(3, { message: "Category name must be at least 3 characters." }).max(100),
    description: z.string().max(255).optional(),
});

const TopicSchema = z.object({
    title: z.string().min(5, { message: "Topic title must be at least 5 characters." }).max(150),
    categoryId: z.string().min(1, {message: "Category is required."}),
    firstPostContent: z.string().min(10, { message: "First post content must be at least 10 characters." }),
    firstPostImageUrl: z.string().optional(), // Optional: For image in the first post
});

const PostSchema = z.object({
    content: z.string().min(10, { message: "Post content must be at least 10 characters." }),
    topicId: z.string().min(1, {message: "Topic ID is required."}),
    postId: z.string().optional(), // For editing existing posts
    imageUrl: z.string().optional(), // Optional: For image in the post
    removeImage: z.string().optional(), // Flag to explicitly remove image
});


// --- Actions ---

// --- Categories ---
export async function createCategory(prevState: any, formData: FormData) {
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
        revalidatePath("/"); // Revalidate home page where categories are listed
        revalidatePath("/admin/categories"); // Revalidate admin page
        return { message: `Category "${newCategory.name}" created successfully.`, success: true };
    } catch (error) {
        console.error("Create Category Error:", error);
        return { message: "Database Error: Failed to create category.", success: false };
    }
}

// --- Topics ---
export async function createTopic(prevState: any, formData: FormData) {
    console.log("[Action createTopic] Received FormData Keys:", Array.from(formData.keys()));
    const user = await getCurrentUser();
    if (!user) {
        return { message: "Unauthorized: You must be logged in to create a topic.", success: false };
    }

     const validatedFields = TopicSchema.safeParse({
        title: formData.get("title"),
        categoryId: formData.get("categoryId"),
        firstPostContent: formData.get("firstPostContent"),
        firstPostImageUrl: formData.get("firstPostImageUrl") || undefined, // Handle empty string as undefined
    });


     if (!validatedFields.success) {
        console.error("[Action createTopic] Validation failed:", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to create topic. Check title, category, and first post content.",
            success: false,
        };
    }

    const { title, categoryId, firstPostContent, firstPostImageUrl } = validatedFields.data;
    console.log("[Action createTopic] Validated Data:", { title, categoryId, firstPostContent: '...', firstPostImageUrl: '...' }); // Avoid logging full content/image

    try {
        // dbCreateTopic now also creates the first post internally in placeholder
         console.log("[Action createTopic] Calling dbCreateTopic with:", { title, categoryId, authorId: user.id });
        const newTopic = await dbCreateTopic({
            title,
            categoryId,
            authorId: user.id,
            firstPostContent,
            firstPostImageUrl: firstPostImageUrl === "" ? undefined : firstPostImageUrl,
        });
         console.log("[Action createTopic] dbCreateTopic successful, New Topic ID:", newTopic.id);

        // Revalidate paths *before* redirecting
        revalidatePath(`/categories/${categoryId}`);
        revalidatePath('/');

        // If dbCreateTopic and revalidatePath succeed, redirect.
        // This call throws a NEXT_REDIRECT error internally to signal Next.js
        redirect(`/topics/${newTopic.id}`);

    } catch (error: any) {
        console.error("[Action createTopic] Error during topic creation, revalidation, or redirect:", error);

        // Check if it's the special redirect error. If so, re-throw it.
        // Next.js redirect() throws an error with a specific digest.
        if (typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
            console.warn("[Action createTopic] Caught NEXT_REDIRECT error, re-throwing for Next.js to handle navigation.");
            throw error;
        }

        // Handle other errors (from dbCreateTopic or revalidatePath)
        let errorMessage = "Database Error: Failed to create topic.";
        if (error instanceof Error && error.message) { // Check if error.message exists
            errorMessage = `${errorMessage} ${error.message}`;
        }
        return { message: errorMessage, success: false };
    }
}

// --- Posts ---
export async function submitPost(prevState: any, formData: FormData) {
    console.log("[Action submitPost] Received FormData Keys:", Array.from(formData.keys()));
    const user = await getCurrentUser();
    if (!user) {
        return { message: "Unauthorized: You must be logged in to post.", success: false };
    }

    // Log raw values before parsing
    console.log("[Action submitPost] Raw Form Data:", {
        content: formData.get("content")?.toString().substring(0, 50) + '...', // Log excerpt
        topicId: formData.get("topicId"),
        postId: formData.get("postId"),
        imageUrl: formData.get("imageUrl")?.toString().substring(0, 50) + '...', // Log excerpt
        removeImage: formData.get("removeImage"),
    });

    const validatedFields = PostSchema.safeParse({
        content: formData.get("content"),
        topicId: formData.get("topicId"),
        postId: formData.get("postId") || undefined, // Ensure empty string/null becomes undefined
        imageUrl: formData.get("imageUrl") || undefined, // Optional: For image, handle empty string
        removeImage: formData.get("removeImage") || undefined, // Optional flag
    });

    if (!validatedFields.success) {
         console.error("[Action submitPost] Validation failed:", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to submit post. Check content length.",
            success: false,
        };
    }

    const { content, topicId, postId } = validatedFields.data;
    const finalImageUrl = validatedFields.data.imageUrl === "" ? undefined : validatedFields.data.imageUrl; // Ensure empty string becomes undefined
    const removeImage = formData.get("removeImage") === "true"; // Ensure boolean conversion is robust
    console.log("[Action submitPost] Validated Data:", { content: '...', topicId, postId, imageUrl: '...', removeImage }); // Avoid logging full content/image

    try {
        let savedPost;
        if (postId) {
            // Editing existing post
            console.log(`[Action submitPost] Updating post ${postId} for user ${user.id}`);
            savedPost = await dbUpdatePost(postId, content, user.id, removeImage ? null : finalImageUrl);
            if (!savedPost) {
                 console.error(`[Action submitPost] dbUpdatePost failed for post ${postId}`);
                 return { message: "Error: Failed to update post. Post not found or permission denied.", success: false };
            }
            console.log(`[Action submitPost] Post ${postId} updated successfully.`);
            revalidatePath(`/topics/${topicId}`);
            return { message: "Post updated successfully.", success: true, post: savedPost };
        } else {
            // Creating new post
            console.log(`[Action submitPost] Creating new post in topic ${topicId} for user ${user.id}`);
            savedPost = await dbCreatePost({ content, topicId, authorId: user.id, imageUrl: finalImageUrl });
            console.log(`[Action submitPost] New post created successfully with ID ${savedPost.id}`);
            revalidatePath(`/topics/${topicId}`); // Revalidate the topic page
            // Attempt to revalidate category page - needs category ID from topic
            if (savedPost.topic?.categoryId) {
                revalidatePath(`/categories/${savedPost.topic.categoryId}`); // Revalidate category page (counts)
            } else {
                console.warn("[Action submitPost] Could not revalidate category page - categoryId missing from savedPost.topic");
            }
            revalidatePath('/'); // Revalidate home (counts)
            return { message: "Reply posted successfully.", success: true, post: savedPost }; // Changed message slightly for clarity
        }

    } catch (error: any) {
        console.error("[Action submitPost] Error:", error);
        const actionType = postId ? 'update' : 'create';
        // Provide a clearer message for actual database/validation errors
        let errorMessage = `Database Error: Failed to ${actionType} post.`;
        if (error instanceof Error && error.message) { // Check if error.message exists
            errorMessage = `${errorMessage} ${error.message}`;
        }
        return { message: errorMessage, success: false };
    }
}

export async function deletePost(postId: string, topicId: string): Promise<{success: boolean, message: string}> {
    const user = await getCurrentUser();
     if (!user) {
        // Although UI should prevent this, add server-side check
         console.error("[Action deletePost] Unauthorized delete attempt.");
        return { success: false, message: "Unauthorized: You must be logged in to delete posts."};
    }

    try {
        console.log(`[Action deletePost] Deleting post ${postId} in topic ${topicId} by user ${user.id}`);
        const success = await dbDeletePost(postId, user.id, user.isAdmin ?? false); // Pass isAdmin status
        if (!success) {
             console.error(`[Action deletePost] dbDeletePost failed for post ${postId}`);
             return { success: false, message: "Failed to delete post. Post not found or permission denied."};
        }
        console.log(`[Action deletePost] Post ${postId} deleted successfully.`);
        revalidatePath(`/topics/${topicId}`); // Revalidate the topic page after deletion

        // Fetch topic to get category ID for revalidation
        const topic = await import('@/lib/placeholder-data').then(mod => mod.getTopicByIdSimple(topicId));
        if (topic?.categoryId) {
            revalidatePath(`/categories/${topic.categoryId}`);
        } else {
             console.warn(`[Action deletePost] Could not revalidate category page - topic ${topicId} or its categoryId not found.`);
        }
         revalidatePath('/'); // Revalidate home page potentially
         revalidatePath('/admin'); // Revalidate admin dashboard counts
        return { message: "Post deleted successfully.", success: true };
    } catch (error: any) {
        console.error("[Action deletePost] Error:", error);
        return { success: false, message: (error instanceof Error && error.message) ? error.message : "Database Error: Failed to delete post." };
    }
}

// Helper function (can be called from Server Components)
export const getPostsByTopic = async (topicId: string) => {
    // In a real app, you'd fetch from your actual DB here
    console.log(`[Action getPostsByTopic] Fetching posts for topic ${topicId}`);
    const posts = await import('@/lib/placeholder-data').then(mod => mod.getPostsByTopic(topicId));
     console.log(`[Action getPostsByTopic] Found ${posts.length} posts for topic ${topicId}`);
    return posts;
}

