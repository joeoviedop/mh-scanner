import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const getActiveForTarget = query({
  args: {
    targetType: v.union(
      v.literal("channel"),
      v.literal("episode"),
      v.literal("transcription")
    ),
    targetId: v.string(),
  },
  handler: async (ctx, { targetType, targetId }) => {
    return ctx.db
      .query("scanJobs")
      .withIndex("by_target", (q) => q.eq("targetType", targetType).eq("targetId", targetId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "running")
        )
      )
      .order("desc")
      .first();
  },
});

// Get all jobs for a target (for progress tracking)
export const getByTarget = query({
  args: {
    targetType: v.union(
      v.literal("channel"),
      v.literal("episode"),
      v.literal("transcription")
    ),
    targetId: v.string(),
  },
  handler: async (ctx, { targetType, targetId }) => {
    return ctx.db
      .query("scanJobs")
      .withIndex("by_target", (q) => q.eq("targetType", targetType).eq("targetId", targetId))
      .order("desc")
      .take(10); // Get last 10 jobs for this target
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("fetch_episodes"),
      v.literal("fetch_transcription"),
      v.literal("process_mentions"),
      v.literal("full_channel_scan")
    ),
    targetType: v.union(
      v.literal("channel"),
      v.literal("episode"),
      v.literal("transcription")
    ),
    targetId: v.string(),
    createdBy: v.string(),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"))),
    parameters: v.optional(v.any()),
    itemsTotal: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("scanJobs", {
      type: args.type,
      targetType: args.targetType,
      targetId: args.targetId,
      status: "pending",
      progress: 0,
      itemsProcessed: 0,
      retryCount: 0,
      maxRetries: 3,
      scheduledAt: Date.now(),
      createdBy: args.createdBy,
      priority: args.priority ?? "normal",
      parameters: args.parameters,
      itemsTotal: args.itemsTotal,
    });
  },
});

export const updateStatus = mutation({
  args: {
    jobId: v.id("scanJobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    progress: v.optional(v.number()),
    itemsProcessed: v.optional(v.number()),
    itemsTotal: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    currentStep: v.optional(v.string()),
    results: v.optional(v.any()),
    retryCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Scan job not found");
    }

    const update: Partial<Doc<"scanJobs">> = {
      status: args.status,
    };

    if (args.progress !== undefined) update.progress = args.progress;
    if (args.itemsProcessed !== undefined) update.itemsProcessed = args.itemsProcessed;
    if (args.itemsTotal !== undefined) update.itemsTotal = args.itemsTotal;
    if (args.errorMessage !== undefined) update.errorMessage = args.errorMessage;
    if (args.currentStep !== undefined) update.currentStep = args.currentStep;
    if (args.results !== undefined) update.results = args.results;
    if (args.retryCount !== undefined) update.retryCount = args.retryCount;

    const now = Date.now();
    if (args.status === "running" && !job.startedAt) {
      update.startedAt = now;
    }

    if (args.status === "completed" || args.status === "failed" || args.status === "cancelled") {
      update.completedAt = now;
    }

    await ctx.db.patch(args.jobId, update);
  },
});

export const appendProgressLog = mutation({
  args: {
    jobId: v.id("scanJobs"),
    message: v.string(),
  },
  handler: async (ctx, { jobId, message }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return;

    const log = Array.isArray(job.results?.log) ? job.results.log : [];
    log.push({ message, at: Date.now() });

    await ctx.db.patch(jobId, {
      results: {
        ...job.results,
        log,
      },
    });
  },
});
