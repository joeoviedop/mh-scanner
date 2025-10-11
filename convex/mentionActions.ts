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
      console.log("🔍 Fetching active keywords from database...");
      let activeKeywords = await ctx.runQuery(api.keywordConfig.getActiveKeywords);
      console.log(`📝 Found ${activeKeywords.length} active keywords from DB:`, activeKeywords.slice(0, 10));
      
      // FALLBACK: Use hardcoded keywords if database is empty
      if (activeKeywords.length === 0) {
        console.warn("⚠️ No keywords in database, using fallback keywords...");
        activeKeywords = [
          "terapia", "terapeuta", "psicólogo", "psicóloga", "psicología",
          "salud mental", "psiquiatra", "psiquiatría", "tratamiento psicológico",
          "sesión de terapia", "mi terapeuta", "mi psicólogo", "mi psicóloga",
          "ansiedad", "depresión", "depresion", "crisis de pánico", "pánico",
          "autolesión", "autolesion", "suicidio", "salud emocional",
          "bienestar mental", "apoyo psicológico", "manejo de emociones",
          "problemas emocionales", "trauma", "estrés", "estres", "burnout",
          "ataque de ansiedad", "consulta psicológica", "cuidado mental",
          "mindfulness", "autoestima", "diagnóstico mental", "diagnostico mental",
          "terapia familiar", "terapia de pareja", "terapia grupal", "terapia online",
          "acompañamiento terapéutico", "medicación psiquiátrica", "antidepresivos",
          "ansiolíticos", "estabilizadores del ánimo", "trastorno", "fobia",
          "TOC", "TDAH", "bipolar", "esquizofrenia", "borderline", "TEPT",
          "trastorno de ansiedad", "trastorno depresivo", "ideación suicida",
          "pensamientos suicidas", "cutting", "bulimia", "anorexia",
          "trastorno alimenticio", "adicción", "rehabilitación", "desintoxicación"
        ];
        console.log(`✅ Using ${activeKeywords.length} fallback keywords`);
      }

      console.log(`🎯 Detecting keyword matches in ${transcription.segments.length} segments...`);
      console.log("First few segments preview:", transcription.segments.slice(0, 3).map(s => s.text.substring(0, 50) + "..."));
      const matches = detectKeywordMatches(transcription.segments, activeKeywords, {
        windowSeconds: 45,
        maxMatches: 30,
      });
      console.log(`✅ Found ${matches.length} keyword matches`);
      if (matches.length > 0) {
        console.log("First match example:", {
          text: matches[0].matchedText.substring(0, 100) + "...",
          keywords: matches[0].matchedKeywords,
          startTime: matches[0].startTime
        });
      }

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
        console.log(`🤖 Classifying fragment ${index + 1}/${matches.length}:`);
        console.log(`   Text: ${match.matchedText.substring(0, 80)}...`);
        console.log(`   Keywords: ${match.matchedKeywords.join(", ")}`);
        console.log(`   Language: ${transcription.language || "unknown"}`);
        
        let classification;
        try {
          classification = await client.classifyFragment({
            fragmentText: match.matchedText,
            contextText: match.contextText,
            keywords: match.matchedKeywords,
            language: transcription.language,
          });

          console.log(`   ✅ Classified: ${classification.tema} (${classification.confianza}% confidence)`);
          confidenceTotal += classification.confianza;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`   ❌ Classification failed for fragment ${index + 1}:`, errorMessage);
          throw error; // Re-throw to fail the entire process
        }

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
