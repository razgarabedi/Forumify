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
