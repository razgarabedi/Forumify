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
    // Content for the first post is handled separately or implicitly
});

const PostSchema = z.object({
    content: z.string().min(10, { message: "Post content must be at least 10 characters." }),
    topicId: z.string().min(1, {message: "Topic ID is required."}),
    postId: z.string().optional(), // For editing existing posts
});


// --- Actions ---

// --- Categories ---
export async function createCategory(prevState: any, formData: FormData) {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
        return { message: "Unauthorized: Only admins can create categories." };
    }

    const validatedFields = CategorySchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to create category.",
        };
    }

    const { name, description } = validatedFields.data;

    try {
        const newCategory = await dbCreateCategory({ name, description });
        revalidatePath("/"); // Revalidate home page where categories are listed
        return { message: `Category "${newCategory.name}" created successfully.`, success: true };
    } catch (error) {
        console.error("Create Category Error:", error);
        return { message: "Database Error: Failed to create category." };
    }
}

// --- Topics ---
export async function createTopic(prevState: any, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) {
        return { message: "Unauthorized: You must be logged in to create a topic." };
    }

     const validatedFields = TopicSchema.safeParse({
        title: formData.get("title"),
        categoryId: formData.get("categoryId"),
    });

    const firstPostContent = formData.get("firstPostContent") as string | null; // Get content for the first post

     if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to create topic. Check title and category.",
        };
    }
    // Validate first post content separately if needed
     if (!firstPostContent || firstPostContent.length < 10) {
        return {
            errors: { firstPostContent: ["First post content must be at least 10 characters."] },
            message: "Failed to create topic. Check first post content.",
        };
    }


    const { title, categoryId } = validatedFields.data;

    try {
        // dbCreateTopic now also creates the first post internally in placeholder
        const newTopic = await dbCreateTopic({ title, categoryId, authorId: user.id });

        // Update the initial post created by dbCreateTopic with actual content
        const posts = await getPostsByTopic(newTopic.id);
        if (posts.length > 0) {
            await dbUpdatePost(posts[0].id, firstPostContent, user.id);
        }


        revalidatePath(`/categories/${categoryId}`); // Revalidate the category page
        revalidatePath('/'); // Revalidate home potentially for counts
        // Redirect to the newly created topic page
        redirect(`/topics/${newTopic.id}`);
        // return { message: `Topic "${newTopic.title}" created successfully.`, success: true, topicId: newTopic.id };
    } catch (error) {
        console.error("Create Topic Error:", error);
        return { message: "Database Error: Failed to create topic." };
    }
}

// --- Posts ---
export async function submitPost(prevState: any, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) {
        return { message: "Unauthorized: You must be logged in to post." };
    }

    const validatedFields = PostSchema.safeParse({
        content: formData.get("content"),
        topicId: formData.get("topicId"),
        postId: formData.get("postId"), // Optional: For editing
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Failed to submit post.",
        };
    }

    const { content, topicId, postId } = validatedFields.data;

    try {
        let savedPost;
        if (postId) {
            // Editing existing post
            savedPost = await dbUpdatePost(postId, content, user.id);
            if (!savedPost) {
                 return { message: "Error: Failed to update post. Post not found or permission denied." };
            }
            revalidatePath(`/topics/${topicId}`);
            return { message: "Post updated successfully.", success: true, post: savedPost };
        } else {
            // Creating new post
            savedPost = await dbCreatePost({ content, topicId, authorId: user.id });
            revalidatePath(`/topics/${topicId}`); // Revalidate the topic page
            revalidatePath(`/categories/${savedPost.topic?.categoryId}`); // Revalidate category page (counts)
             revalidatePath('/'); // Revalidate home (counts)
            return { message: "Post created successfully.", success: true, post: savedPost };
        }

    } catch (error) {
        console.error("Submit Post Error:", error);
        return { message: "Database Error: Failed to save post." };
    }
}

export async function deletePost(postId: string, topicId: string) {
    const user = await getCurrentUser();
     if (!user) {
        // Although UI should prevent this, add server-side check
        throw new Error("Unauthorized: You must be logged in to delete posts.");
    }

    try {
        const success = await dbDeletePost(postId, user.id);
        if (!success) {
             throw new Error("Failed to delete post. Post not found or permission denied.");
        }
        revalidatePath(`/topics/${topicId}`); // Revalidate the topic page after deletion
        // Potentially revalidate category and home pages if counts are affected
         revalidatePath(`/categories/[categoryId]`); // Placeholder, need actual category ID if possible
         revalidatePath('/');
        return { message: "Post deleted successfully.", success: true };
    } catch (error) {
        console.error("Delete Post Error:", error);
        // Throw error to be caught by the component or return error state
        throw new Error(error instanceof Error ? error.message : "Database Error: Failed to delete post.");
    }
}

// Helper function (can be called from Server Components)
export const getPostsByTopic = async (topicId: string) => {
    // In a real app, you'd fetch from your actual DB here
    const posts = await import('@/lib/placeholder-data').then(mod => mod.getPostsByTopic(topicId));
    return posts;
}
