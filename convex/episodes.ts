/**
 * Convex Functions - Episodes
 * 
 * Handles operations for YouTube video episodes:
 * - Creating and updating episode records
 * - Querying episodes with filters and pagination
 * - Managing processing status
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// Query: Get episodes with filters and pagination
export const list = query({
  args: {
    channelId: v.optional(v.id("channels")),
    status: v.optional(v.union(
      v.literal("discovered"),
      v.literal("transcribing"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("error"),
      v.literal("skipped")
    )),
    hasMentions: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    minDuration: v.optional(v.number()), // In seconds
    maxDuration: v.optional(v.number()), // In seconds
    publishedAfter: v.optional(v.number()), // Unix timestamp
    publishedBefore: v.optional(v.number()), // Unix timestamp
  },
  handler: async (ctx, { 
    channelId, 
    status, 
    hasMentions, 
    limit = 50,
    minDuration,
    maxDuration,
    publishedAfter,
    publishedBefore
  }) => {
    let queryBuilder;
    
    // Apply primary filter with index
    if (channelId) {
      queryBuilder = ctx.db.query("episodes").withIndex("by_channel", (q) => q.eq("sourceChannel", channelId));
    } else if (status) {
      queryBuilder = ctx.db.query("episodes").withIndex("by_status", (q) => q.eq("status", status));
    } else if (hasMentions !== undefined) {
      queryBuilder = ctx.db.query("episodes").withIndex("by_has_mentions", (q) => q.eq("hasMentions", hasMentions));
    } else {
      queryBuilder = ctx.db.query("episodes");
    }
    
    // Apply additional filters
    if ((channelId || hasMentions !== undefined) && status) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("status"), status));
    }
    
    if ((channelId || status) && hasMentions !== undefined) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("hasMentions"), hasMentions));
    }
    
    // Apply additional filters
    if (minDuration) {
      queryBuilder = queryBuilder.filter((q) => q.gte(q.field("durationSeconds"), minDuration));
    }
    
    if (maxDuration) {
      queryBuilder = queryBuilder.filter((q) => q.lte(q.field("durationSeconds"), maxDuration));
    }
    
    if (publishedAfter) {
      queryBuilder = queryBuilder.filter((q) => q.gte(q.field("publishedAt"), publishedAfter));
    }
    
    if (publishedBefore) {
      queryBuilder = queryBuilder.filter((q) => q.lte(q.field("publishedAt"), publishedBefore));
    }
    
    const episodes = await queryBuilder.order("desc").take(limit);
    
    return episodes.map(episode => ({
      ...episode,
      publishedAtFormatted: new Date(episode.publishedAt).toISOString(),
      discoveredAtFormatted: new Date(episode.discoveredAt).toISOString(),
      transcriptionFetchedAtFormatted: episode.transcriptionFetchedAt
        ? new Date(episode.transcriptionFetchedAt).toISOString()
        : null,
      processedAtFormatted: episode.processedAt
        ? new Date(episode.processedAt).toISOString()
        : null,
    }));
  },
});

// Query: Get episode by video ID
export const getByVideoId = query({
  args: { videoId: v.string() },
  handler: async (ctx, { videoId }) => {
    return await ctx.db
      .query("episodes")
      .withIndex("by_video_id", (q) => q.eq("videoId", videoId))
      .first();
  },
});

// Query: Get episode by ID
export const getById = query({
  args: { id: v.id("episodes") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Query: Get episodes that need processing
export const getEpisodesForProcessing = query({
  args: {
    status: v.optional(v.union(
      v.literal("discovered"),
      v.literal("transcribing"),
      v.literal("processing")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit = 20 }) => {
    let queryBuilder;
    
    if (status) {
      queryBuilder = ctx.db.query("episodes").withIndex("by_status", (q) => q.eq("status", status));
    } else {
      // Get episodes that haven't been completed yet
      queryBuilder = ctx.db.query("episodes").filter((q) => 
        q.neq(q.field("status"), "completed") &&
        q.neq(q.field("status"), "skipped") &&
        q.neq(q.field("status"), "error")
      );
    }
    
    return await queryBuilder.order("asc").take(limit);
  },
});

// Query: Get recent episodes for a channel
export const getRecentByChannel = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, { channelId, limit = 10, daysBack = 30 }) => {
    const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    
    return await ctx.db
      .query("episodes")
      .withIndex("by_channel_and_published", (q) => 
        q.eq("sourceChannel", channelId).gte("publishedAt", cutoffTime)
      )
      .order("desc")
      .take(limit);
  },
});

// Mutation: Create or update an episode
export const createOrUpdate = mutation({
  args: {
    videoId: v.string(),
    title: v.string(),
    description: v.string(),
    channelId: v.string(),
    channelTitle: v.string(),
    publishedAt: v.number(),
    duration: v.string(),
    durationSeconds: v.number(),
    thumbnailUrl: v.optional(v.string()),
    
    // YouTube stats
    viewCount: v.optional(v.string()),
    likeCount: v.optional(v.string()),
    commentCount: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    
    // Internal
    sourceChannel: v.id("channels"),
    discoveredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if episode already exists
    const existingEpisode = await ctx.db
      .query("episodes")
      .withIndex("by_video_id", (q) => q.eq("videoId", args.videoId))
      .first();
    
    const now = Date.now();
    
    if (existingEpisode) {
      // Update existing episode (refresh metadata)
      return await ctx.db.patch(existingEpisode._id, {
        title: args.title,
        description: args.description,
        channelTitle: args.channelTitle,
        thumbnailUrl: args.thumbnailUrl,
        viewCount: args.viewCount,
        likeCount: args.likeCount,
        commentCount: args.commentCount,
        tags: args.tags,
        
        // Reset error status if it was in error before
        ...(existingEpisode.status === "error" && {
          status: "discovered" as const,
          processingError: undefined,
        }),
      });
    } else {
      // Create new episode
      return await ctx.db.insert("episodes", {
        videoId: args.videoId,
        title: args.title,
        description: args.description,
        channelId: args.channelId,
        channelTitle: args.channelTitle,
        publishedAt: args.publishedAt,
        duration: args.duration,
        durationSeconds: args.durationSeconds,
        thumbnailUrl: args.thumbnailUrl,
        viewCount: args.viewCount,
        likeCount: args.likeCount,
        commentCount: args.commentCount,
        tags: args.tags,
        sourceChannel: args.sourceChannel,
        discoveredAt: args.discoveredAt ?? now,
        
        // Initial processing state
        hasTranscription: false,
        hasBeenProcessed: false,
        hasMentions: false,
        mentionCount: 0,
        status: "discovered",
      });
    }
  },
});

// Mutation: Update processing status
export const updateProcessingStatus = mutation({
  args: {
    episodeId: v.id("episodes"),
    status: v.union(
      v.literal("discovered"),
      v.literal("transcribing"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("error"),
      v.literal("skipped")
    ),
    errorMessage: v.optional(v.string()),
    
    // Transcription fields
    hasTranscription: v.optional(v.boolean()),
    transcriptionFetchedAt: v.optional(v.number()),
    transcriptionError: v.optional(v.string()),
    
    // Processing fields
    hasBeenProcessed: v.optional(v.boolean()),
    processedAt: v.optional(v.number()),
    processingError: v.optional(v.string()),
    
    // Results
    hasMentions: v.optional(v.boolean()),
    mentionCount: v.optional(v.number()),
    averageConfidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { episodeId, status, errorMessage, ...updateFields } = args;
    
    const updateData: Partial<Doc<"episodes">> = {
      status,
      ...updateFields,
    };
    
    // Handle error states
    if (status === "error") {
      if (errorMessage) {
        if (updateFields.transcriptionError === undefined && updateFields.processingError === undefined) {
          updateData.processingError = errorMessage;
        }
      }
    } else {
      // Clear error messages when not in error state
      if (status === "completed") {
        updateData.transcriptionError = undefined;
        updateData.processingError = undefined;
      }
    }
    
    // Set timestamps
    if (status === "completed" && updateFields.processedAt === undefined) {
      updateData.processedAt = Date.now();
      updateData.hasBeenProcessed = true;
    }
    
    return await ctx.db.patch(episodeId, updateData);
  },
});

// Mutation: Update mention results
export const updateMentionResults = mutation({
  args: {
    episodeId: v.id("episodes"),
    mentionCount: v.number(),
    averageConfidence: v.number(),
  },
  handler: async (ctx, { episodeId, mentionCount, averageConfidence }) => {
    return await ctx.db.patch(episodeId, {
      hasMentions: mentionCount > 0,
      mentionCount,
      averageConfidence,
      status: "completed",
      hasBeenProcessed: true,
      processedAt: Date.now(),
      processingError: undefined, // Clear any previous errors
    });
  },
});

// Query: Get episode statistics
export const getStats = query({
  args: {
    channelId: v.optional(v.id("channels")),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, { channelId, daysBack = 30 }) => {
    let queryBuilder;
    
    if (channelId) {
      queryBuilder = ctx.db.query("episodes").withIndex("by_channel", (q) => q.eq("sourceChannel", channelId));
    } else {
      queryBuilder = ctx.db.query("episodes");
    }
    
    // Filter by date range if specified
    if (daysBack) {
      const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
      queryBuilder = queryBuilder.filter((q) => q.gte(q.field("discoveredAt"), cutoffTime));
    }
    
    const episodes = await queryBuilder.collect();
    
    const stats = {
      total: episodes.length,
      withTranscriptions: 0,
      processed: 0,
      withMentions: 0,
      totalMentions: 0,
      averageDuration: 0,
      byStatus: {
        discovered: 0,
        transcribing: 0,
        processing: 0,
        completed: 0,
        error: 0,
        skipped: 0,
      },
      totalDuration: 0,
      averageConfidence: 0,
    };
    
    let totalConfidence = 0;
    let episodesWithConfidence = 0;
    
    episodes.forEach(episode => {
      if (episode.hasTranscription) stats.withTranscriptions++;
      if (episode.hasBeenProcessed) stats.processed++;
      if (episode.hasMentions) stats.withMentions++;
      
      stats.totalMentions += episode.mentionCount;
      stats.totalDuration += episode.durationSeconds;
      stats.byStatus[episode.status]++;
      
      if (episode.averageConfidence) {
        totalConfidence += episode.averageConfidence;
        episodesWithConfidence++;
      }
    });
    
    if (episodes.length > 0) {
      stats.averageDuration = Math.round(stats.totalDuration / episodes.length);
    }
    
    if (episodesWithConfidence > 0) {
      stats.averageConfidence = Math.round(totalConfidence / episodesWithConfidence);
    }
    
    return stats;
  },
});

// Query: Search episodes by title or description (basic implementation)
// TODO: Implement proper full-text search with Convex search indexes
export const search = query({
  args: {
    searchTerm: v.string(),
    channelId: v.optional(v.id("channels")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { searchTerm, channelId, limit = 100 }) => {
    let queryBuilder;
    
    if (channelId) {
      queryBuilder = ctx.db.query("episodes").withIndex("by_channel", (q) => q.eq("sourceChannel", channelId));
    } else {
      queryBuilder = ctx.db.query("episodes");
    }
    
    // Get episodes and filter client-side for now
    // This is not ideal for large datasets but works for MVP
    const allEpisodes = await queryBuilder.order("desc").take(limit);
    
    const searchTermLower = searchTerm.toLowerCase();
    const filteredEpisodes = allEpisodes.filter(episode => 
      episode.title.toLowerCase().includes(searchTermLower) ||
      episode.description.toLowerCase().includes(searchTermLower)
    );
    
    return filteredEpisodes.slice(0, 20);
  },
});
