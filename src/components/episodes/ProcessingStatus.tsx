"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface ProcessingJob {
  _id: Id<"scanJobs">;
  type: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  currentStep?: string;
  itemsProcessed: number;
  itemsTotal?: number;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
  results?: {
    matches?: number;
    classified?: number;
    averageConfidence?: number;
  };
}

interface ProcessingStatusProps {
  episodeId: Id<"episodes">;
  onProgressUpdate?: (status: ProcessingJob["status"], progress: number) => void;
  onCompletion?: () => void;
}

const STEP_DESCRIPTIONS = {
  keyword_filter: "🔍 Scanning transcript for therapy keywords...",
  llm_classification: "🤖 Analyzing mentions with AI...",
  saving_results: "💾 Saving analysis results...",
  no_matches: "✅ Scan completed - no therapy mentions found",
  completed: "✅ Analysis completed successfully",
};

export default function ProcessingStatus({ 
  episodeId, 
  onProgressUpdate, 
  onCompletion 
}: ProcessingStatusProps) {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getConvexClient = () => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error("Convex URL not configured");
    return new ConvexHttpClient(url);
  };

  const fetchJobStatus = useCallback(async () => {
    try {
      const convex = getConvexClient();
      const jobs = await convex.query(api.scanJobs.getByTarget, {
        targetType: "episode",
        targetId: episodeId,
      });

      console.log("📊 Jobs found:", jobs.length, jobs.map(j => ({ type: j.type, status: j.status })));

      const processingJob = jobs.find(j => j.type === "process_mentions");
      if (processingJob) {
        console.log("✅ Processing job status:", processingJob.status, "Progress:", processingJob.progress);
        setJob(processingJob);
        
        // Stop polling if completed or failed
        if (processingJob.status === "completed" || processingJob.status === "failed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } else {
        console.log("⚠️ No processing job found yet");
      }
    } catch (error) {
      console.error("Failed to fetch job status:", error);
      // Clear interval on error
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [episodeId]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up polling based on job status
    if (job?.status === "running" || job?.status === "pending") {
      intervalRef.current = setInterval(fetchJobStatus, 1000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [job?.status, fetchJobStatus]);

  useEffect(() => {
    if (job?.status === "completed" && onCompletion) {
      onCompletion();
    }

    if (onProgressUpdate) {
      onProgressUpdate(job?.status ?? "pending", job?.progress ?? 0);
    }
  }, [job, onProgressUpdate, onCompletion]);

  const startProcessing = async (force = false) => {
    try {
      setStartTime(Date.now());
      setJob({
        _id: "" as Id<"scanJobs">, // Temporary
        type: "process_mentions",
        status: "pending",
        progress: 0,
        itemsProcessed: 0,
        currentStep: "initializing",
      });

      console.log("🚀 Starting mention detection for episode:", episodeId);

      const response = await fetch("/api/process/detect-mentions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ episodeId, force }),
      });

      const data = await response.json();
      console.log("📡 API Response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to start processing");
      }

      // If skipped because episode is processing, retry with force
      if (data.result?.status === "skipped" && data.result?.reason === "episode_processing") {
        console.log("⚠️ Episode stuck in processing, retrying with force...");
        
        const forceResponse = await fetch("/api/process/detect-mentions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ episodeId, force: true }),
        });

        const forceData = await forceResponse.json();
        console.log("📡 Force retry response:", forceData);
        
        if (!forceResponse.ok || !forceData.success) {
          throw new Error(forceData.error ?? "Failed to force processing");
        }
      }

      // Wait a bit before first poll to allow job creation
      setTimeout(() => {
        fetchJobStatus();
      }, 500);
      
      // Start continuous polling
      intervalRef.current = setInterval(fetchJobStatus, 1000);
    } catch (error) {
      console.error("❌ Failed to start processing:", error);
      setJob(prev => prev ? {
        ...prev,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      } : null);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    return `${remainingSeconds}s`;
  };

  const getElapsedTime = () => {
    if (!startTime) return "";
    return formatDuration(Date.now() - startTime);
  };

  const getProgressPercentage = () => {
    if (!job) return 0;
    if (job.status === "completed") return 100;
    if (job.status === "failed") return 0;
    
    if (job.itemsTotal && job.itemsTotal > 0) {
      return Math.floor((job.itemsProcessed / job.itemsTotal) * 100);
    }
    
    return job.progress;
  };

  const getStatusColor = (status: ProcessingJob["status"]) => {
    switch (status) {
      case "pending":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "running":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const renderProgressBar = () => {
    const percentage = getProgressPercentage();
    const isProcessing = job?.status === "running";
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            isProcessing 
              ? "bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse" 
              : job?.status === "completed"
              ? "bg-green-500"
              : job?.status === "failed"
              ? "bg-red-500"
              : "bg-gray-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const renderResults = () => {
    if (!job?.results || job.status !== "completed") return null;

    const { matches = 0, classified = 0, averageConfidence = 0 } = job.results;

    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="text-sm font-medium text-green-800 mb-2">📊 Analysis Results</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-green-600">Mentions Found:</span>
            <span className="font-semibold ml-1">{matches}</span>
          </div>
          <div>
            <span className="text-green-600">Classified:</span>
            <span className="font-semibold ml-1">{classified}</span>
          </div>
          <div>
            <span className="text-green-600">Avg Confidence:</span>
            <span className="font-semibold ml-1">{Math.round(averageConfidence)}%</span>
          </div>
        </div>
      </div>
    );
  };

  if (!job) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => startProcessing(false)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          🔍 Start Mention Detection
        </button>
        <button
          onClick={() => startProcessing(true)}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
        >
          🔄 Force Reprocess (if stuck)
        </button>
        <div className="text-sm text-gray-600 text-center">
          This will analyze the transcript for therapy and mental health mentions
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className={`p-4 border rounded-lg ${getStatusColor(job.status)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">
              {job.status === "pending" && "🔄 Initializing..."}
              {job.status === "running" && "🤖 Processing Mentions"}
              {job.status === "completed" && "✅ Analysis Complete"}
              {job.status === "failed" && "❌ Processing Failed"}
            </h3>
            {job.currentStep && (
              <p className="text-sm mt-1">
                {STEP_DESCRIPTIONS[job.currentStep as keyof typeof STEP_DESCRIPTIONS] || job.currentStep}
              </p>
            )}
          </div>
          
          <div className="text-right text-sm">
            {startTime && (
              <div>Elapsed: {getElapsedTime()}</div>
            )}
            {job.itemsTotal && (
              <div>
                {job.itemsProcessed} / {job.itemsTotal}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          {renderProgressBar()}
          <div className="flex justify-between text-xs mt-1 text-gray-600">
            <span>{getProgressPercentage()}%</span>
            <span>
              {job.status === "completed" 
                ? "Processing complete" 
                : job.status === "running"
                ? "In progress..."
                : job.status === "failed"
                ? "Failed"
                : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {job.status === "failed" && job.errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <strong>Error:</strong> {job.errorMessage}
        </div>
      )}

      {/* Results */}
      {renderResults()}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {(job.status === "failed" || job.status === "completed") && (
          <button
            onClick={() => startProcessing(true)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            🔄 Reprocess
          </button>
        )}
        
        {job.status === "running" && (
          <button
            disabled
            className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm"
          >
            ⏳ Processing...
          </button>
        )}
      </div>
    </div>
  );
}
