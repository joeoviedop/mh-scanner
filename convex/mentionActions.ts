import { v } from "convex/values";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { detectKeywordMatches } from "../lib/processing/keyword-filter";
import { getOpenAIClient } from "../lib/integrations/llm/openai";

type FragmentInput = {
  transcriptionId: Id<"transcriptions">;
  videoId: string;
  text: string;
  context: string;
  startTime: number;
  endTime: number;
  classification: {
    tema: "testimonio" | "recomendacion" | "reflexion" | "dato" | "otro";
    tono: "positivo" | "neutro" | "critico" | "preocupante";
    sensibilidad: ("autolesion" | "suicidio" | "abuso" | "trauma" | "crisis" | "ninguna")[];
    confianza: number;
    tags?: string[];
    razon?: string;
  };
  detectedAt: number;
  detectedBy: "keyword_filter" | "llm_classifier" | "manual";
  confidenceScore: number;
  reviewStatus: "pending" | "reviewed" | "approved" | "rejected";
  feedbackCount: number;
  positiveFeedback: number;
  negativeFeedback: number;
  averageRating?: number;
  rankScore: number;
  youtubeUrl: string;
};

type DetectionSummary = {
  totalMatches: number;
  classified: number;
  averageConfidence: number;
};

type DetectionResult =
  | { status: "skipped"; reason: string }
  | { status: "queued"; jobId: Id<"scanJobs"> }
  | { status: "completed"; jobId: Id<"scanJobs">; summary: DetectionSummary }
  | { status: "failed"; jobId: Id<"scanJobs">; error: string };

export const detectMentionsForEpisode = action({
  args: {
    episodeId: v.id("episodes"),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, { episodeId, force = false }): Promise<DetectionResult> => {
    const episode = (await ctx.runQuery(api.episodes.getById, { id: episodeId })) as
      | (Doc<"episodes"> & { _id: Id<"episodes"> })
      | null;

    if (!episode) {
      throw new Error("Episode not found");
    }

    const transcription = (await ctx.runQuery(api.transcriptions.getByEpisodeId, { episodeId })) as
      | (Doc<"transcriptions"> & { _id: Id<"transcriptions"> })
      | null;

    if (!transcription) {
      return {
        status: "skipped",
        reason: "missing_transcription",
      } satisfies DetectionResult;
    }

    if (episode.status === "processing" && !force) {
      return {
        status: "skipped",
        reason: "episode_processing",
      } satisfies DetectionResult;
    }

    const existingJob = (await ctx.runQuery(api.scanJobs.getActiveForTarget, {
      targetType: "episode",
      targetId: episode._id,
    })) as (Doc<"scanJobs"> & { _id: Id<"scanJobs"> }) | null;

    if (existingJob && existingJob.type === "process_mentions" && !force) {
      return {
        status: "queued",
        jobId: existingJob._id,
      } satisfies DetectionResult;
    }

    const jobId = (await ctx.runMutation(api.scanJobs.create, {
      type: "process_mentions",
      targetType: "episode",
      targetId: episode._id,
      createdBy: "system",
      parameters: {
        episodeId,
        transcriptionId: transcription._id,
      },
    })) as Id<"scanJobs">;

    await ctx.runMutation(api.scanJobs.updateStatus, {
      jobId,
      status: "running",
      currentStep: "keyword_filter",
      itemsTotal: transcription.segments.length,
    });

    await ctx.runMutation(api.episodes.updateProcessingStatus, {
      episodeId,
      status: "processing",
      hasMentions: false,
      mentionCount: 0,
      averageConfidence: 0,
    });

    try {
      // Get active keywords from configuration
      console.log("🔍 Fetching active keywords...");
      const activeKeywords = await ctx.runQuery(api.keywordConfig.getActiveKeywords);
      console.log(`📝 Found ${activeKeywords.length} active keywords:`, activeKeywords.slice(0, 5));
      
      if (activeKeywords.length === 0) {
        console.error("❌ No active keywords configured for detection");
        throw new Error("No active keywords configured for detection");
      }

      console.log(`🎯 Detecting keyword matches in ${transcription.segments.length} segments...`);
      const matches = detectKeywordMatches(transcription.segments, activeKeywords, {
        windowSeconds: 45,
        maxMatches: 30,
      });
      console.log(`✅ Found ${matches.length} keyword matches`);

      if (matches.length === 0) {
        console.log("🔍 No keyword matches found - completing job without LLM analysis");
        await ctx.runMutation(api.fragments.deleteByEpisode, { episodeId });
        await ctx.runMutation(api.episodes.updateMentionResults, {
          episodeId,
          mentionCount: 0,
          averageConfidence: 0,
        });

        await ctx.runMutation(api.scanJobs.updateStatus, {
          jobId,
          status: "completed",
          progress: 100,
          itemsProcessed: 0,
          currentStep: "no_matches",
          results: {
            matches: 0,
          },
        });

        return {
          status: "completed",
          jobId,
          summary: {
            totalMatches: 0,
            classified: 0,
            averageConfidence: 0,
          },
        } satisfies DetectionResult;
      }

      console.log("🤖 Starting LLM classification phase...");
      await ctx.runMutation(api.scanJobs.updateStatus, {
        jobId,
        status: "running",
        currentStep: "llm_classification",
        itemsProcessed: 0,
        itemsTotal: matches.length,
      });

      const client = getOpenAIClient();
      const classifiedFragments: FragmentInput[] = [];
      const now = Date.now();
      let confidenceTotal = 0;

      for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];
        console.log(`🤖 Classifying fragment ${index + 1}/${matches.length}:`, match.matchedText.substring(0, 50) + "...");
        
        const classification = await client.classifyFragment({
          fragmentText: match.matchedText,
          contextText: match.contextText,
          keywords: match.matchedKeywords,
          language: transcription.language,
        });

        confidenceTotal += classification.confianza;

        const startTime = Math.max(0, Math.round(match.startTime));
        const endTime = Math.max(startTime, Math.round(match.endTime));
        const youtubeUrl = `https://www.youtube.com/watch?v=${episode.videoId}&t=${startTime}s`;
        const rankScore = Math.min(100, classification.confianza + match.matchedKeywords.length * 5);

        classifiedFragments.push({
          transcriptionId: transcription._id,
          videoId: episode.videoId,
          text: match.matchedText,
          context: match.contextText,
          startTime,
          endTime,
          classification: {
            tema: classification.tema,
            tono: classification.tono,
            sensibilidad: classification.sensibilidad.length ? classification.sensibilidad : ["ninguna"],
            confianza: classification.confianza,
            tags: classification.tags && classification.tags.length ? classification.tags : undefined,
            razon: classification.razon ?? undefined,
          },
          detectedAt: now,
          detectedBy: "llm_classifier",
          confidenceScore: classification.confianza,
          reviewStatus: "pending",
          feedbackCount: 0,
          positiveFeedback: 0,
          negativeFeedback: 0,
          averageRating: undefined,
          rankScore,
          youtubeUrl,
        });

        await ctx.runMutation(api.scanJobs.updateStatus, {
          jobId,
          status: "running",
          itemsProcessed: index + 1,
          progress: Math.round(((index + 1) / matches.length) * 100),
        });
      }

      await ctx.runMutation(api.fragments.replaceForEpisode, {
        episodeId,
        fragments: classifiedFragments,
      });

      const averageConfidence = Math.round(confidenceTotal / matches.length);

      await ctx.runMutation(api.episodes.updateMentionResults, {
        episodeId,
        mentionCount: matches.length,
        averageConfidence,
      });

      await ctx.runMutation(api.scanJobs.updateStatus, {
        jobId,
        status: "completed",
        progress: 100,
        itemsProcessed: matches.length,
        currentStep: "completed",
        results: {
          matches: matches.length,
          averageConfidence,
        },
      });

      return {
        status: "completed",
        jobId,
        summary: {
          totalMatches: matches.length,
          classified: matches.length,
          averageConfidence,
        },
      } satisfies DetectionResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to detect mentions";

      await ctx.runMutation(api.scanJobs.updateStatus, {
        jobId,
        status: "failed",
        errorMessage: message,
      });

      await ctx.runMutation(api.episodes.updateProcessingStatus, {
        episodeId,
        status: "error",
        processingError: message,
      });

      return {
        status: "failed",
        jobId,
        error: message,
      } satisfies DetectionResult;
    }
  },
});
