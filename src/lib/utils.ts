
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses content for @username mentions.
 * @param content The text content to parse.
 * @returns An array of unique usernames (without the '@' prefix).
 */
export function parseMentions(content: string): string[] {
  if (!content) return [];
  const mentionRegex = /@(\w+)/g;
  const matches = content.matchAll(mentionRegex);
  const usernames = new Set<string>();
  for (const match of matches) {
    usernames.add(match[1]); // match[1] is the captured group (username)
  }
  return Array.from(usernames);
}

/**
 * Checks if a value is a valid Date object.
 * @param d The value to check.
 * @returns True if d is a Date object and represents a valid date, false otherwise.
 */
export function isValidDate(d: any): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Generates a URL-friendly slug from a given text.
 * @param text The text to slugify.
 * @returns A URL-friendly slug.
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars but hyphens (allows letters, numbers, underscore, hyphen)
    .replace(/--+/g, '-')          // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}
