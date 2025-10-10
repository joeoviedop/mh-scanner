/**
 * Convex Functions - Channels
 * 
 * Handles operations for YouTube channels and playlists:
 * - Creating and updating channel records
 * - Querying channels with filters
 * - Managing scan configuration
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// Query: Get all channels
export const list = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("error"),
      v.literal("deleted")
    )),
    type: v.optional(v.union(v.literal("channel"), v.literal("playlist"))),
  },
  handler: async (ctx, { limit = 50, status, type }) => {
    let queryBuilder;
    
    if (status) {
      queryBuilder = ctx.db.query("channels").withIndex("by_status", (q) => q.eq("status", status));
    } else if (type) {
      queryBuilder = ctx.db.query("channels").withIndex("by_type", (q) => q.eq("type", type));
    } else {
      queryBuilder = ctx.db.query("channels");
    }
    
    // Apply additional filters if needed
    if (type && status) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("type"), type));
    }
    
    const channels = await queryBuilder.order("desc").take(limit);
    
    return channels.map(channel => ({
      ...channel,
      addedAtFormatted: new Date(channel.addedAt).toISOString(),
      lastScanAtFormatted: channel.lastScanAt 
        ? new Date(channel.lastScanAt).toISOString()
        : null,
    }));
  },
});

// Query: Get channel by YouTube ID
export const getByYouTubeId = query({
  args: { youtubeId: v.string() },
  handler: async (ctx, { youtubeId }) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", youtubeId))
      .first();
  },
});

// Query: Get channel by ID
export const getById = query({
  args: { id: v.id("channels") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Query: Get channels that need scanning
export const getChannelsForScanning = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000; // 24 hours ago
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000; // 1 week ago
    
    const channels = await ctx.db
      .query("channels")
      .withIndex("by_scan_enabled", (q) => q.eq("scanEnabled", true))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    return channels.filter(channel => {
      if (!channel.lastScanAt) return true; // Never scanned before
      
      switch (channel.scanFrequency) {
        case "daily":
          return channel.lastScanAt < oneDayAgo;
        case "weekly":
          return channel.lastScanAt < oneWeekAgo;
        case "manual":
        default:
          return false; // Manual channels don't get auto-scanned
      }
    });
  },
});

// Mutation: Create or update a channel
export const createOrUpdate = mutation({
  args: {
    youtubeId: v.string(),
    type: v.union(v.literal("channel"), v.literal("playlist")),
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    
    // Channel-specific fields
    subscriberCount: v.optional(v.string()),
    videoCount: v.optional(v.string()),
    customUrl: v.optional(v.string()),
    
    // Playlist-specific fields
    channelId: v.optional(v.string()),
    channelTitle: v.optional(v.string()),
    itemCount: v.optional(v.number()),
    
    // Configuration
    originalUrl: v.string(),
    displayName: v.optional(v.string()),
    addedBy: v.string(),
    scanFrequency: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("manual")
    )),
  },
  handler: async (ctx, args) => {
    // Check if channel already exists
    const existingChannel = await ctx.db
      .query("channels")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
      .first();
    
    const now = Date.now();
    
    if (existingChannel) {
      // Update existing channel
      return await ctx.db.patch(existingChannel._id, {
        title: args.title,
        description: args.description,
        thumbnailUrl: args.thumbnailUrl,
        subscriberCount: args.subscriberCount,
        videoCount: args.videoCount,
        customUrl: args.customUrl,
        channelId: args.channelId,
        channelTitle: args.channelTitle,
        itemCount: args.itemCount,
        status: "active", // Reactivate if it was paused/error
        errorMessage: undefined, // Clear any previous error
      });
    } else {
      // Create new channel
      return await ctx.db.insert("channels", {
        youtubeId: args.youtubeId,
        type: args.type,
        title: args.title,
        description: args.description,
        thumbnailUrl: args.thumbnailUrl,
        subscriberCount: args.subscriberCount,
        videoCount: args.videoCount,
        customUrl: args.customUrl,
        channelId: args.channelId,
        channelTitle: args.channelTitle,
        itemCount: args.itemCount,
        scanEnabled: true,
        scanFrequency: args.scanFrequency ?? "weekly",
        originalUrl: args.originalUrl,
        displayName: args.displayName,
        addedAt: now,
        addedBy: args.addedBy,
        status: "active",
      });
    }
  },
});

// Mutation: Update channel scan configuration
export const updateScanConfig = mutation({
  args: {
    channelId: v.id("channels"),
    scanEnabled: v.optional(v.boolean()),
    scanFrequency: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("manual")
    )),
  },
  handler: async (ctx, { channelId, scanEnabled, scanFrequency }) => {
    const updateData: Partial<Doc<"channels">> = {};
    
    if (scanEnabled !== undefined) {
      updateData.scanEnabled = scanEnabled;
    }
    
    if (scanFrequency !== undefined) {
      updateData.scanFrequency = scanFrequency;
    }
    
    return await ctx.db.patch(channelId, updateData);
  },
});

// Mutation: Update last scan timestamp
export const updateLastScan = mutation({
  args: {
    channelId: v.id("channels"),
    timestamp: v.optional(v.number()), // If not provided, uses current time
    episodeCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { channelId, timestamp, episodeCount, errorMessage }) => {
    const updateData: Partial<Doc<"channels">> = {
      lastScanAt: timestamp ?? Date.now(),
    };
    
    if (errorMessage) {
      updateData.status = "error";
      updateData.errorMessage = errorMessage;
    } else {
      updateData.status = "active";
      updateData.errorMessage = undefined;
    }
    
    return await ctx.db.patch(channelId, updateData);
  },
});

// Mutation: Pause/resume channel
export const updateStatus = mutation({
  args: {
    channelId: v.id("channels"),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("error"),
      v.literal("deleted")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { channelId, status, errorMessage }) => {
    return await ctx.db.patch(channelId, {
      status,
      errorMessage,
    });
  },
});

// Mutation: Delete channel (soft delete)
export const deleteChannel = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    return await ctx.db.patch(channelId, {
      status: "deleted",
      scanEnabled: false,
    });
  },
});

// Query: Get channel statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const channels = await ctx.db.query("channels").collect();
    
    const stats = {
      total: channels.length,
      active: 0,
      paused: 0,
      error: 0,
      deleted: 0,
      scanEnabled: 0,
      channelType: 0,
      playlistType: 0,
      scanFrequency: {
        daily: 0,
        weekly: 0,
        manual: 0,
      },
    };
    
    channels.forEach(channel => {
      stats[channel.status]++;
      
      if (channel.scanEnabled) {
        stats.scanEnabled++;
      }
      
      if (channel.type === "channel") {
        stats.channelType++;
      } else {
        stats.playlistType++;
      }
      
      stats.scanFrequency[channel.scanFrequency]++;
    });
    
    return stats;
  },
});