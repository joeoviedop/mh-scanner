/**
 * YouTube URL Parser Utility
 * 
 * Parses and validates YouTube URLs to extract channel IDs, playlist IDs, and video IDs.
 * Supports various YouTube URL formats including:
 * - Channel URLs: youtube.com/c/channelname, youtube.com/channel/UCxxxxx, youtube.com/@username
 * - Playlist URLs: youtube.com/playlist?list=PLxxxxx
 * - Video URLs: youtube.com/watch?v=xxxxx
 */

import { z } from "zod";

// YouTube URL patterns
const YOUTUBE_PATTERNS = {
  // Channel patterns
  channelId: /(?:youtube\.com\/channel\/)([a-zA-Z0-9_-]+)/,
  channelCustom: /(?:youtube\.com\/c\/)([a-zA-Z0-9_-]+)/,
  channelHandle: /(?:youtube\.com\/@)([a-zA-Z0-9_.-]+)/,
  
  // Playlist pattern
  playlist: /[?&]list=([a-zA-Z0-9_-]+)/,
  
  // Video pattern
  video: /[?&]v=([a-zA-Z0-9_-]{11})/,
} as const;

// Schemas for validation
export const YouTubeUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

export const ParsedYouTubeUrl = z.object({
  type: z.enum(["channel", "playlist", "video"]),
  id: z.string(),
  originalUrl: z.string(),
  displayName: z.string().optional(),
});

export type YouTubeUrlType = z.infer<typeof ParsedYouTubeUrl>["type"];
export type ParsedYouTubeUrlType = z.infer<typeof ParsedYouTubeUrl>;

/**
 * Parses a YouTube URL and extracts relevant information
 */
export function parseYouTubeUrl(url: string): ParsedYouTubeUrlType | null {
  try {
    // Validate URL format
    const validatedUrl = YouTubeUrlSchema.parse({ url });
    const cleanUrl = validatedUrl.url.trim();
    
    // Check if it's a YouTube URL
    if (!cleanUrl.includes("youtube.com") && !cleanUrl.includes("youtu.be")) {
      return null;
    }

    // Try to parse as playlist first
    const playlistMatch = cleanUrl.match(YOUTUBE_PATTERNS.playlist);
    if (playlistMatch) {
      return {
        type: "playlist",
        id: playlistMatch[1],
        originalUrl: cleanUrl,
      };
    }

    // Try to parse as video
    const videoMatch = cleanUrl.match(YOUTUBE_PATTERNS.video);
    if (videoMatch) {
      return {
        type: "video",
        id: videoMatch[1],
        originalUrl: cleanUrl,
      };
    }

    // Try to parse as channel (various formats)
    // 1. Channel ID format (UC...)
    const channelIdMatch = cleanUrl.match(YOUTUBE_PATTERNS.channelId);
    if (channelIdMatch) {
      return {
        type: "channel",
        id: channelIdMatch[1],
        originalUrl: cleanUrl,
      };
    }

    // 2. Custom channel name (/c/)
    const channelCustomMatch = cleanUrl.match(YOUTUBE_PATTERNS.channelCustom);
    if (channelCustomMatch) {
      return {
        type: "channel",
        id: channelCustomMatch[1],
        originalUrl: cleanUrl,
        displayName: channelCustomMatch[1],
      };
    }

    // 3. Handle format (@username)
    const channelHandleMatch = cleanUrl.match(YOUTUBE_PATTERNS.channelHandle);
    if (channelHandleMatch) {
      return {
        type: "channel",
        id: channelHandleMatch[1],
        originalUrl: cleanUrl,
        displayName: `@${channelHandleMatch[1]}`,
      };
    }

    // If no patterns match, return null
    return null;
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
    return null;
  }
}

/**
 * Validates if a string is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  const parsed = parseYouTubeUrl(url);
  return parsed !== null;
}

/**
 * Extracts just the ID from a YouTube URL
 */
export function extractYouTubeId(url: string): string | null {
  const parsed = parseYouTubeUrl(url);
  return parsed?.id ?? null;
}

/**
 * Gets the YouTube URL type (channel, playlist, video)
 */
export function getYouTubeUrlType(url: string): YouTubeUrlType | null {
  const parsed = parseYouTubeUrl(url);
  return parsed?.type ?? null;
}

/**
 * Normalizes a YouTube URL to a standard format
 */
export function normalizeYouTubeUrl(url: string): string | null {
  const parsed = parseYouTubeUrl(url);
  if (!parsed) return null;

  switch (parsed.type) {
    case "channel":
      // For channels, we need to determine if it's a channel ID or handle
      if (parsed.id.startsWith("UC") && parsed.id.length === 24) {
        return `https://www.youtube.com/channel/${parsed.id}`;
      } else if (parsed.displayName?.startsWith("@")) {
        return `https://www.youtube.com/${parsed.displayName}`;
      } else {
        return `https://www.youtube.com/c/${parsed.id}`;
      }
    case "playlist":
      return `https://www.youtube.com/playlist?list=${parsed.id}`;
    case "video":
      return `https://www.youtube.com/watch?v=${parsed.id}`;
    default:
      return null;
  }
}

/**
 * Validates multiple YouTube URLs at once
 */
export function validateYouTubeUrls(urls: string[]): {
  valid: ParsedYouTubeUrlType[];
  invalid: string[];
} {
  const valid: ParsedYouTubeUrlType[] = [];
  const invalid: string[] = [];

  for (const url of urls) {
    const parsed = parseYouTubeUrl(url);
    if (parsed) {
      valid.push(parsed);
    } else {
      invalid.push(url);
    }
  }

  return { valid, invalid };
}