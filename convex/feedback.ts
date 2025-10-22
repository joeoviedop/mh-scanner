import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { calculateFragmentRank } from "./utils/ranking";

const ratingValidator = v.union(
  v.literal("useful"),
  v.literal("not_useful"),
  v.literal("irrelevant"),
);

const issuesValidator = v.array(
  v.union(
    v.literal("false_positive"),
    v.literal("wrong_category"),
    v.literal("poor_context"),
    v.literal("incomplete_text"),
    v.literal("timing_off"),
    v.literal("other"),
  ),
);

function getReviewStatusFromFeedback(positive: number, negative: number, total: number) {
  if (total === 0) {
    return "pending" as const;
  }

  if (positive > 0 && negative === 0) {
    return "approved" as const;
  }

  if (negative > 0 && positive === 0) {
    return "rejected" as const;
  }

  return "reviewed" as const;
}

function aggregateIssues(feedbackEntries: Doc<"feedback">[]) {
  return feedbackEntries.reduce<Record<string, number>>((acc, entry) => {
    for (const issue of entry.issues ?? []) {
      acc[issue] = (acc[issue] ?? 0) + 1;
    }
    return acc;
  }, {});
}

export const submitFeedback = mutation({
  args: {
    fragmentId: v.id("fragments"),
    rating: ratingValidator,
    relevanceScore: v.optional(v.number()),
    qualityScore: v.optional(v.number()),
    comment: v.optional(v.string()),
    issues: v.optional(issuesValidator),
    submittedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fragment = await ctx.db.get(args.fragmentId);
    if (!fragment) {
      throw new Error("Fragment not found");
    }

    const feedbackId = await ctx.db.insert("feedback", {
      fragmentId: args.fragmentId,
      rating: args.rating,
      relevanceScore: args.relevanceScore,
      qualityScore: args.qualityScore,
      comment: args.comment,
      issues: args.issues,
      submittedAt: Date.now(),
      submittedBy: args.submittedBy ?? "dashboard_user",
      version: fragment._creationTime,
    });

    const allFeedback = await ctx.db
      .query("feedback")
      .withIndex("by_fragment", (q) => q.eq("fragmentId", args.fragmentId))
      .collect();

    const total = allFeedback.length;
    const positive = allFeedback.filter((entry) => entry.rating === "useful").length;
    const negative = allFeedback.filter((entry) => entry.rating !== "useful").length;
    const averageRating = total === 0 ? undefined : Number(((positive / total) * 5).toFixed(2));
    const reviewStatus = getReviewStatusFromFeedback(positive, negative, total);

    await ctx.db.patch(args.fragmentId, {
      feedbackCount: total,
      positiveFeedback: positive,
      negativeFeedback: negative,
      averageRating,
      reviewStatus,
    });

    const rankScore = calculateFragmentRank({
      confidenceScore: fragment.confidenceScore,
      feedbackCount: total,
      positiveFeedback: positive,
      negativeFeedback: negative,
    });

    const issues = aggregateIssues(allFeedback);

    return {
      feedbackId,
      fragmentId: args.fragmentId,
      summary: {
        total,
        positive,
        negative,
        approvalRate: total > 0 ? Number((positive / total).toFixed(3)) : null,
        averageRating,
        rankScore,
        issues,
      },
    };
  },
});

export const listForFragment = query({
  args: {
    fragmentId: v.id("fragments"),
  },
  handler: async (ctx, { fragmentId }) => {
    return ctx.db
      .query("feedback")
      .withIndex("by_fragment", (q) => q.eq("fragmentId", fragmentId))
      .order("desc")
      .collect();
  },
});

export const statsByEpisode = query({
  args: {
    episodeId: v.id("episodes"),
  },
  handler: async (ctx, { episodeId }) => {
    const fragments = await ctx.db
      .query("fragments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    if (fragments.length === 0) {
      return {
        totalFragments: 0,
        fragmentsWithFeedback: 0,
        feedbackCount: 0,
        positiveFeedback: 0,
        negativeFeedback: 0,
        approvalRate: null,
        coverageRate: 0,
        averageConfidence: 0,
        averageRankScore: 0,
        topIssues: [],
        promptRecommendations: [],
      };
    }

    let totalFeedback = 0;
    let totalPositive = 0;
    let totalNegative = 0;
    let accumulatedConfidence = 0;
    let accumulatedRankScore = 0;
    let fragmentsWithFeedback = 0;

    const issueCounts: Record<string, number> = {};

    const fragmentsWithIssueDetails: typeof fragments = [];

    for (const fragment of fragments) {
      accumulatedConfidence += fragment.confidenceScore;

      const { feedbackCount, positiveFeedback, negativeFeedback } = fragment;

      if (feedbackCount > 0) {
        fragmentsWithFeedback += 1;
        totalFeedback += feedbackCount;
        totalPositive += positiveFeedback;
        totalNegative += negativeFeedback;

        const rankScore = calculateFragmentRank({
          confidenceScore: fragment.confidenceScore,
          feedbackCount,
          positiveFeedback,
          negativeFeedback,
        });
        accumulatedRankScore += rankScore;

        fragmentsWithIssueDetails.push(fragment);
      }
    }

    if (fragmentsWithIssueDetails.length > 0) {
      const feedbackCollections = await Promise.all(
        fragmentsWithIssueDetails.map((fragment) =>
          ctx.db
            .query("feedback")
            .withIndex("by_fragment", (q) => q.eq("fragmentId", fragment._id))
            .collect(),
        ),
      );

      fragmentsWithIssueDetails.forEach((fragment, index) => {
        const feedbackEntries = feedbackCollections[index];
        const fragmentIssues = aggregateIssues(feedbackEntries);
        for (const [issue, count] of Object.entries(fragmentIssues)) {
          issueCounts[issue] = (issueCounts[issue] ?? 0) + count;
        }
      });
    }

    const approvalRate =
      totalFeedback > 0 ? Number((totalPositive / totalFeedback).toFixed(3)) : null;
    const coverageRate = Number((fragmentsWithFeedback / fragments.length).toFixed(3));
    const averageConfidence = Number(
      (accumulatedConfidence / fragments.length).toFixed(2),
    );
    const averageRankScore =
      fragmentsWithFeedback > 0
        ? Number((accumulatedRankScore / fragmentsWithFeedback).toFixed(3))
        : 0;

    const topIssues = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    const promptRecommendations = generatePromptRecommendations(issueCounts);

    return {
      totalFragments: fragments.length,
      fragmentsWithFeedback,
      feedbackCount: totalFeedback,
      positiveFeedback: totalPositive,
      negativeFeedback: totalNegative,
      approvalRate,
      coverageRate,
      averageConfidence,
      averageRankScore,
      topIssues,
      promptRecommendations,
    };
  },
});

function generatePromptRecommendations(issueCounts: Record<string, number>) {
  if (Object.keys(issueCounts).length === 0) {
    return [];
  }

  const recommendations: string[] = [];

  if ((issueCounts.false_positive ?? 0) > 0) {
    recommendations.push(
      "Refina las instrucciones del prompt para exigir ejemplos textuales específicos antes de clasificar una mención.",
    );
  }

  if ((issueCounts.wrong_category ?? 0) > 0) {
    recommendations.push(
      "Agrega definiciones más precisas de cada tema y ejemplos límite para reducir confusiones en la clasificación.",
    );
  }

  if ((issueCounts.poor_context ?? 0) > 0 || (issueCounts.incomplete_text ?? 0) > 0) {
    recommendations.push(
      "Incluye una instrucción para considerar más contexto previo/posterior en la transcripción antes de etiquetar fragmentos.",
    );
  }

  if ((issueCounts.timing_off ?? 0) > 0) {
    recommendations.push(
      "Revisa el prompt para que valide que los timestamps estén alineados con la evidencia antes de aceptar el fragmento.",
    );
  }

  if ((issueCounts.other ?? 0) > 0) {
    recommendations.push(
      "Revisa el feedback textual proporcionado para descubrir matices adicionales y refinar el prompt manualmente.",
    );
  }

  return recommendations;
}
