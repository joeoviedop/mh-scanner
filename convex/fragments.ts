import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { calculateFragmentRank } from "./utils/ranking";

const classificationValidator = v.object({
  tema: v.union(
    v.literal("testimonio"),
    v.literal("recomendacion"),
    v.literal("reflexion"),
    v.literal("dato"),
    v.literal("otro"),
  ),
  tono: v.union(
    v.literal("positivo"),
    v.literal("neutro"),
    v.literal("critico"),
    v.literal("preocupante"),
  ),
  sensibilidad: v.array(
    v.union(
      v.literal("autolesion"),
      v.literal("suicidio"),
      v.literal("abuso"),
      v.literal("trauma"),
      v.literal("crisis"),
      v.literal("ninguna"),
    ),
  ),
  confianza: v.number(),
  tags: v.optional(v.array(v.string())),
  razon: v.optional(v.string()),
});

const fragmentInputValidator = v.object({
  transcriptionId: v.id("transcriptions"),
  videoId: v.string(),
  text: v.string(),
  context: v.string(),
  startTime: v.number(),
  endTime: v.number(),
  classification: classificationValidator,
  detectedAt: v.number(),
  detectedBy: v.union(
    v.literal("keyword_filter"),
    v.literal("llm_classifier"),
    v.literal("manual"),
  ),
  confidenceScore: v.number(),
  reviewStatus: v.union(
    v.literal("pending"),
    v.literal("reviewed"),
    v.literal("approved"),
    v.literal("rejected"),
  ),
  feedbackCount: v.number(),
  positiveFeedback: v.number(),
  negativeFeedback: v.number(),
  averageRating: v.optional(v.number()),
  // Removed: rankScore and youtubeUrl (not in schema)
});

export const listByEpisode = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const fragments = await ctx.db
      .query("fragments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .order("asc")
      .collect();

    const decorated = fragments.map((fragment) => {
      const rankScore = calculateFragmentRank({
        confidenceScore: fragment.confidenceScore,
        feedbackCount: fragment.feedbackCount,
        positiveFeedback: fragment.positiveFeedback,
        negativeFeedback: fragment.negativeFeedback,
      });

      const approvalRate =
        fragment.feedbackCount > 0
          ? Number((fragment.positiveFeedback / fragment.feedbackCount).toFixed(3))
          : null;

      return {
        ...fragment,
        detectedAtIso: new Date(fragment.detectedAt).toISOString(),
        rankScore,
        feedbackSummary: {
          total: fragment.feedbackCount,
          positive: fragment.positiveFeedback,
          negative: fragment.negativeFeedback,
          approvalRate,
        },
      };
    });

    return decorated.sort((a, b) => b.rankScore - a.rankScore);
  },
});

export const deleteByEpisode = mutation({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const fragments = await ctx.db
      .query("fragments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    await Promise.all(fragments.map(async (fragment) => ctx.db.delete(fragment._id)));
  },
});

export const replaceForEpisode = mutation({
  args: {
    episodeId: v.id("episodes"),
    fragments: v.array(fragmentInputValidator),
  },
  handler: async (ctx, { episodeId, fragments }) => {
    const existing = await ctx.db
      .query("fragments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    await Promise.all(existing.map(async (doc) => ctx.db.delete(doc._id)));

    const insertedIds: Id<"fragments">[] = [];
    for (const fragment of fragments) {
      const id = await ctx.db.insert("fragments", {
        episodeId,
        ...fragment,
      });
      insertedIds.push(id);
    }

    return insertedIds;
  },
});

export const upsertFragment = mutation({
  args: {
    episodeId: v.id("episodes"),
    fragment: fragmentInputValidator,
  },
  handler: async (ctx, { episodeId, fragment }) => {
    const existing = await ctx.db
      .query("fragments")
      .withIndex("by_episode_and_time", (q) => q.eq("episodeId", episodeId).eq("startTime", fragment.startTime))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...fragment,
      });
      return existing._id;
    }

    return ctx.db.insert("fragments", {
      episodeId,
      ...fragment,
    });
  },
});
