/**
 * YouTube Data API Integration
 * 
 * Handles communication with YouTube Data API v3 for:
 * - Channel information retrieval
 * - Playlist information and video listing
 * - Video details and metadata
 * - Rate limiting and error handling
 */

import { z } from "zod";

// YouTube API Response Schemas
export const YouTubeChannelSchema = z.object({
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    description: z.string(),
    customUrl: z.string().optional(),
    publishedAt: z.string(),
    thumbnails: z.object({
      default: z.object({ url: z.string() }).optional(),
      medium: z.object({ url: z.string() }).optional(),
      high: z.object({ url: z.string() }).optional(),
    }),
  }),
  statistics: z.object({
    viewCount: z.string().optional(),
    subscriberCount: z.string().optional(),
    videoCount: z.string().optional(),
  }),
  contentDetails: z.object({
    relatedPlaylists: z.object({
      uploads: z.string(),
    }),
  }),
});

export const YouTubePlaylistSchema = z.object({
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    description: z.string(),
    channelId: z.string(),
    channelTitle: z.string(),
    publishedAt: z.string(),
    thumbnails: z.object({
      default: z.object({ url: z.string() }).optional(),
      medium: z.object({ url: z.string() }).optional(),
      high: z.object({ url: z.string() }).optional(),
    }),
  }),
  contentDetails: z.object({
    itemCount: z.number(),
  }),
});

export const YouTubeVideoSchema = z.object({
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    description: z.string(),
    channelId: z.string(),
    channelTitle: z.string(),
    publishedAt: z.string(),
    thumbnails: z.object({
      default: z.object({ url: z.string() }).optional(),
      medium: z.object({ url: z.string() }).optional(),
      high: z.object({ url: z.string() }).optional(),
    }),
    tags: z.array(z.string()).optional(),
  }),
  contentDetails: z.object({
    duration: z.string(),
  }),
  statistics: z.object({
    viewCount: z.string().optional(),
    likeCount: z.string().optional(),
    commentCount: z.string().optional(),
  }),
});

export type YouTubeChannel = z.infer<typeof YouTubeChannelSchema>;
export type YouTubePlaylist = z.infer<typeof YouTubePlaylistSchema>;
export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;

// API Error Types
export class YouTubeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public quotaExceeded?: boolean
  ) {
    super(message);
    this.name = "YouTubeAPIError";
  }
}

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerSecond: 10,
  maxRequestsPerDay: 10000, // Default quota
};

class YouTubeAPIClient {
  private apiKey: string;
  private baseUrl = "https://www.googleapis.com/youtube/v3";
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Rate limiting helper
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / RATE_LIMIT.maxRequestsPerSecond;

    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Generic API request handler
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    await this.enforceRateLimit();

    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.append("key", this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403 && errorData.error?.errors?.[0]?.reason === "quotaExceeded") {
          throw new YouTubeAPIError("YouTube API quota exceeded", 403, true);
        }
        
        throw new YouTubeAPIError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError(`Network error: ${error}`);
    }
  }

  /**
   * Get channel information by channel ID or handle
   */
  async getChannel(channelIdentifier: string): Promise<YouTubeChannel | null> {
    try {
      const params: Record<string, string> = {
        part: "snippet,statistics,contentDetails",
      };

      // Determine if it's a channel ID or handle
      if (channelIdentifier.startsWith("UC") && channelIdentifier.length === 24) {
        params.id = channelIdentifier;
      } else if (channelIdentifier.startsWith("@")) {
        params.forHandle = channelIdentifier;
      } else {
        params.forUsername = channelIdentifier;
      }

      const response = await this.makeRequest<{ items: any[] }>("channels", params);
      
      if (!response.items || response.items.length === 0) {
        return null;
      }

      return YouTubeChannelSchema.parse(response.items[0]);
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError(`Failed to fetch channel: ${error}`);
    }
  }

  /**
   * Get playlist information
   */
  async getPlaylist(playlistId: string): Promise<YouTubePlaylist | null> {
    try {
      const response = await this.makeRequest<{ items: any[] }>("playlists", {
        part: "snippet,contentDetails",
        id: playlistId,
      });
      
      if (!response.items || response.items.length === 0) {
        return null;
      }

      return YouTubePlaylistSchema.parse(response.items[0]);
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError(`Failed to fetch playlist: ${error}`);
    }
  }

  /**
   * Get videos from a playlist
   */
  async getPlaylistVideos(
    playlistId: string,
    maxResults = 50,
    pageToken?: string
  ): Promise<{
    videos: YouTubeVideo[];
    nextPageToken?: string;
    totalResults: number;
  }> {
    try {
      // First, get the playlist items
      const playlistItemsResponse = await this.makeRequest<{ 
        items: any[]; 
        nextPageToken?: string;
        pageInfo: { totalResults: number };
      }>("playlistItems", {
        part: "snippet",
        playlistId,
        maxResults: maxResults.toString(),
        pageToken: pageToken || "",
      });

      if (!playlistItemsResponse.items || playlistItemsResponse.items.length === 0) {
        return { videos: [], totalResults: 0 };
      }

      // Extract video IDs
      const videoIds = playlistItemsResponse.items
        .map(item => item.snippet?.resourceId?.videoId)
        .filter(Boolean);

      if (videoIds.length === 0) {
        return { videos: [], totalResults: 0 };
      }

      // Get video details
      const videosResponse = await this.makeRequest<{ items: any[] }>("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoIds.join(","),
      });

      const videos = videosResponse.items
        .map(item => {
          try {
            return YouTubeVideoSchema.parse(item);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as YouTubeVideo[];

      return {
        videos,
        nextPageToken: playlistItemsResponse.nextPageToken,
        totalResults: playlistItemsResponse.pageInfo.totalResults,
      };
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError(`Failed to fetch playlist videos: ${error}`);
    }
  }

  /**
   * Get videos from a channel's uploads playlist
   */
  async getChannelVideos(
    channelId: string,
    maxResults = 50,
    pageToken?: string
  ): Promise<{
    videos: YouTubeVideo[];
    nextPageToken?: string;
    totalResults: number;
  }> {
    try {
      // First get the channel to find the uploads playlist
      const channel = await this.getChannel(channelId);
      if (!channel) {
        throw new YouTubeAPIError("Channel not found");
      }

      const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
      return await this.getPlaylistVideos(uploadsPlaylistId, maxResults, pageToken);
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError(`Failed to fetch channel videos: ${error}`);
    }
  }

  /**
   * Get video details by ID
   */
  async getVideo(videoId: string): Promise<YouTubeVideo | null> {
    try {
      const response = await this.makeRequest<{ items: any[] }>("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoId,
      });
      
      if (!response.items || response.items.length === 0) {
        return null;
      }

      return YouTubeVideoSchema.parse(response.items[0]);
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError(`Failed to fetch video: ${error}`);
    }
  }

  /**
   * Search for channels by name
   */
  async searchChannels(query: string, maxResults = 10): Promise<YouTubeChannel[]> {
    try {
      const searchResponse = await this.makeRequest<{ items: any[] }>("search", {
        part: "snippet",
        q: query,
        type: "channel",
        maxResults: maxResults.toString(),
      });

      if (!searchResponse.items || searchResponse.items.length === 0) {
        return [];
      }

      // Get detailed channel information
      const channelIds = searchResponse.items.map(item => item.snippet.channelId);
      const channelsResponse = await this.makeRequest<{ items: any[] }>("channels", {
        part: "snippet,statistics,contentDetails",
        id: channelIds.join(","),
      });

      return channelsResponse.items
        .map(item => {
          try {
            return YouTubeChannelSchema.parse(item);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as YouTubeChannel[];
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError(`Failed to search channels: ${error}`);
    }
  }

  /**
   * Get current quota usage (estimated)
   */
  getQuotaUsage(): { requests: number; estimatedUnits: number } {
    return {
      requests: this.requestCount,
      estimatedUnits: this.requestCount * 1, // Basic estimate, actual usage varies by operation
    };
  }
}

// Singleton instance
let youtubeClient: YouTubeAPIClient | null = null;

/**
 * Get YouTube API client instance
 */
export function getYouTubeClient(): YouTubeAPIClient {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new YouTubeAPIError("YouTube API key not configured");
  }

  if (!youtubeClient) {
    youtubeClient = new YouTubeAPIClient(apiKey);
  }

  return youtubeClient;
}

/**
 * Helper function to parse ISO 8601 duration to seconds
 */
export function parseDuration(isoDuration: string | null | undefined): number {
  // Handle null/undefined inputs
  if (!isoDuration || typeof isoDuration !== "string") return 0;
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Helper function to format duration in readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}