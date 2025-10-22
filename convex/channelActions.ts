import { v } from "convex/values";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  getYouTubeClient,
  parseDuration,
  type YouTubeChannel,
  type YouTubePlaylist,
  type YouTubeVideo,
  YouTubeAPIError,
} from "../lib/integrations/youtube/youtube-api";

type ParsedSource = {
  type: "channel" | "playlist" | "video";
  id: string;
  originalUrl: string;
  displayName?: string;
};

type ScanSummary = {
  channelId: Id<"channels">;
  channelType: ParsedSource["type"];
  episodesProcessed: number;
  newEpisodes: number;
  updatedEpisodes: number;
  skippedEpisodes: number;
};

const MAX_PAGES = 3;
const PAGE_SIZE = 50;
const MIN_DURATION_SECONDS = 120;

async function upsertChannel(
  ctx: ActionCtx,
  data: YouTubeChannel,
  source: ParsedSource,
  scanFrequency: "daily" | "weekly" | "manual",
  createdBy: string,
): Promise<Doc<"channels">> {
  await ctx.runMutation(api.channels.createOrUpdate, {
    youtubeId: data.id,
    type: "channel",
    title: data.snippet.title,
    description: data.snippet.description ?? "",
    thumbnailUrl: data.snippet.thumbnails.high?.url || data.snippet.thumbnails.medium?.url,
    subscriberCount: data.statistics.subscriberCount,
    videoCount: data.statistics.videoCount,
    customUrl: data.snippet.customUrl,
    originalUrl: source.originalUrl,
    displayName: source.displayName ?? data.snippet.title,
    addedBy: createdBy,
    scanFrequency,
  });

  const channel = await ctx.runQuery(api.channels.getByYouTubeId, {
    youtubeId: data.id,
  });

  if (!channel) {
    throw new Error("Failed to persist channel record");
  }

  return channel;
}

async function upsertPlaylist(
  ctx: ActionCtx,
  data: YouTubePlaylist,
  source: ParsedSource,
  scanFrequency: "daily" | "weekly" | "manual",
  createdBy: string,
): Promise<Doc<"channels">> {
  await ctx.runMutation(api.channels.createOrUpdate, {
    youtubeId: data.id,
    type: "playlist",
    title: data.snippet.title,
    description: data.snippet.description ?? "",
    thumbnailUrl: data.snippet.thumbnails.high?.url || data.snippet.thumbnails.medium?.url,
    channelId: data.snippet.channelId,
    channelTitle: data.snippet.channelTitle,
    itemCount: data.contentDetails.itemCount,
    originalUrl: source.originalUrl,
    displayName: source.displayName ?? data.snippet.title,
    addedBy: createdBy,
    scanFrequency,
  });

  const playlist = await ctx.runQuery(api.channels.getByYouTubeId, {
    youtubeId: data.id,
  });

  if (!playlist) {
    throw new Error("Failed to persist playlist record");
  }

  return playlist;
}

async function saveEpisode(
  ctx: ActionCtx,
  channelId: Id<"channels">,
  video: YouTubeVideo,
): Promise<"created" | "updated" | "skipped"> {
  const durationSeconds = parseDuration(video.contentDetails.duration);
  if (durationSeconds > 0 && durationSeconds < MIN_DURATION_SECONDS) {
    return "skipped";
  }

  const existing = await ctx.runQuery(api.episodes.getByVideoId, { videoId: video.id });

  await ctx.runMutation(api.episodes.createOrUpdate, {
    videoId: video.id,
    title: video.snippet.title,
    description: video.snippet.description ?? "",
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    publishedAt: new Date(video.snippet.publishedAt).getTime(),
    duration: video.contentDetails.duration,
    durationSeconds,
    thumbnailUrl:
      video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url,
    viewCount: video.statistics.viewCount,
    likeCount: video.statistics.likeCount,
    commentCount: video.statistics.commentCount,
    tags: video.snippet.tags,
    sourceChannel: channelId,
    discoveredAt: Date.now(),
  });

  return existing ? "updated" : "created";
}

async function processChannel(
  ctx: ActionCtx,
  source: ParsedSource,
  scanFrequency: "daily" | "weekly" | "manual",
  createdBy: string,
  jobId: Id<"scanJobs">,
): Promise<ScanSummary> {
  const client = getYouTubeClient();
  const channelData = await client.getChannel(source.id);
  if (!channelData) {
    throw new Error("Channel not found");
  }

  const persistedChannel = await upsertChannel(ctx, channelData, source, scanFrequency, createdBy);

  let nextPageToken: string | undefined;
  let considered = 0;
  let processed = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { videos, nextPageToken: token } = await client.getChannelVideos(
      channelData.id,
      PAGE_SIZE,
      nextPageToken,
    );

    for (const video of videos) {
      considered += 1;
      const result = await saveEpisode(ctx, persistedChannel._id, video);
      if (result === "skipped") {
        skipped += 1;
      } else {
        processed += 1;
        if (result === "created") created += 1;
        else updated += 1;
      }

      await ctx.runMutation(api.scanJobs.updateStatus, {
        jobId,
        status: "running",
        itemsProcessed: considered,
        progress: Math.min(99, Math.round((considered / PAGE_SIZE / MAX_PAGES) * 100)),
      });
    }

    if (!token) {
      break;
    }

    nextPageToken = token;
  }

  await ctx.runMutation(api.channels.updateLastScan, {
    channelId: persistedChannel._id,
    timestamp: Date.now(),
  });

  return {
    channelId: persistedChannel._id,
    channelType: "channel",
    episodesProcessed: processed,
    newEpisodes: created,
    updatedEpisodes: updated,
    skippedEpisodes: skipped,
  };
}

async function processPlaylist(
  ctx: ActionCtx,
  source: ParsedSource,
  scanFrequency: "daily" | "weekly" | "manual",
  createdBy: string,
  jobId: Id<"scanJobs">,
): Promise<ScanSummary> {
  const client = getYouTubeClient();
  const playlistData = await client.getPlaylist(source.id);
  if (!playlistData) {
    throw new Error("Playlist not found");
  }

  const persistedPlaylist = await upsertPlaylist(ctx, playlistData, source, scanFrequency, createdBy);

  let nextPageToken: string | undefined;
  let considered = 0;
  let processed = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { videos, nextPageToken: token } = await client.getPlaylistVideos(
      playlistData.id,
      PAGE_SIZE,
      nextPageToken,
    );

    for (const video of videos) {
      considered += 1;
      const result = await saveEpisode(ctx, persistedPlaylist._id, video);
      if (result === "skipped") {
        skipped += 1;
      } else {
        processed += 1;
        if (result === "created") created += 1;
        else updated += 1;
      }

      await ctx.runMutation(api.scanJobs.updateStatus, {
        jobId,
        status: "running",
        itemsProcessed: considered,
        progress: Math.min(99, Math.round((considered / PAGE_SIZE / MAX_PAGES) * 100)),
      });
    }

    if (!token) {
      break;
    }

    nextPageToken = token;
  }

  await ctx.runMutation(api.channels.updateLastScan, {
    channelId: persistedPlaylist._id,
    timestamp: Date.now(),
  });

  return {
    channelId: persistedPlaylist._id,
    channelType: "playlist",
    episodesProcessed: processed,
    newEpisodes: created,
    updatedEpisodes: updated,
    skippedEpisodes: skipped,
  };
}

async function processVideo(
  ctx: ActionCtx,
  source: ParsedSource,
  scanFrequency: "daily" | "weekly" | "manual",
  createdBy: string,
  jobId: Id<"scanJobs">,
): Promise<ScanSummary> {
  const client = getYouTubeClient();
  const video = await client.getVideo(source.id);
  if (!video) {
    throw new Error("Video not found");
  }

  const channelData = await client.getChannel(video.snippet.channelId);
  if (!channelData) {
    throw new Error("Parent channel not found");
  }

  const persistedChannel = await upsertChannel(ctx, channelData, {
    type: "channel",
    id: channelData.id,
    originalUrl: `https://www.youtube.com/channel/${channelData.id}`,
    displayName: channelData.snippet.title,
  }, scanFrequency, createdBy);

  const result = await saveEpisode(ctx, persistedChannel._id, video);
  const processed = result === "skipped" ? 0 : 1;
  const skipped = result === "skipped" ? 1 : 0;

  await ctx.runMutation(api.scanJobs.updateStatus, {
    jobId,
    status: "running",
    itemsProcessed: 1,
    progress: 100,
  });

  await ctx.runMutation(api.channels.updateLastScan, {
    channelId: persistedChannel._id,
    timestamp: Date.now(),
  });

  return {
    channelId: persistedChannel._id,
    channelType: "video",
    episodesProcessed: processed,
    newEpisodes: result === "created" ? 1 : 0,
    updatedEpisodes: result === "updated" ? 1 : 0,
    skippedEpisodes: skipped,
  };
}

export const scanSource = action({
  args: {
    parsed: v.object({
      type: v.union(v.literal("channel"), v.literal("playlist"), v.literal("video")),
      id: v.string(),
      originalUrl: v.string(),
      displayName: v.optional(v.string()),
    }),
    scanFrequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("manual")),
    requestedBy: v.string(),
  },
  handler: async (ctx, { parsed, scanFrequency, requestedBy }) => {
    const jobId = await ctx.runMutation(api.scanJobs.create, {
      type: "fetch_episodes",
      targetType: "channel",
      targetId: parsed.id,
      createdBy: requestedBy,
      priority: "normal",
      parameters: {
        originalUrl: parsed.originalUrl,
        type: parsed.type,
      },
    });

    try {
      let summary: ScanSummary;

      if (parsed.type === "channel") {
        summary = await processChannel(ctx, parsed, scanFrequency, requestedBy, jobId);
      } else if (parsed.type === "playlist") {
        summary = await processPlaylist(ctx, parsed, scanFrequency, requestedBy, jobId);
      } else {
        summary = await processVideo(ctx, parsed, scanFrequency, requestedBy, jobId);
      }

      await ctx.runMutation(api.scanJobs.updateStatus, {
        jobId,
        status: "completed",
        progress: 100,
        itemsProcessed: summary.episodesProcessed,
        currentStep: "completed",
        results: summary,
      });

      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to scan source";

      await ctx.runMutation(api.scanJobs.updateStatus, {
        jobId,
        status: "failed",
        errorMessage: message,
      });

      if (error instanceof YouTubeAPIError) {
        throw error;
      }

      throw new Error(message);
    }
  },
});
