"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ConvexHttpClient } from "convex/browser";

import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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

      const processingJob = jobs.find((j) => j.type === "process_mentions");
      if (processingJob) {
        setJob(processingJob);

        if (processingJob.status === "completed" || processingJob.status === "failed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
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

      const response = await fetch("/api/process/detect-mentions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ episodeId, force }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to start processing");
      }

      // If skipped because episode is processing, retry with force
      if (data.result?.status === "skipped" && data.result?.reason === "episode_processing") {
        
        const forceResponse = await fetch("/api/process/detect-mentions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ episodeId, force: true }),
        });

        const forceData = await forceResponse.json();
        
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
      setJob((prev) => (prev ? {
        ...prev,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      } : null));
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
        return "text-brand-600 bg-brand-50 border-brand-200";
      case "running":
        return "text-skywave-700 bg-skywave-50 border-skywave-200";
      case "completed":
        return "text-success-600 bg-success-50 border-success-200";
      case "failed":
        return "text-danger-600 bg-danger-50 border-danger-200";
      default:
        return "text-sand-600 bg-white/90 border-white/70";
    }
  };

  const renderProgressBar = () => {
    const percentage = getProgressPercentage();
    const isProcessing = job?.status === "running";
    
    return (
      <div className="">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            isProcessing 
              ? "bg-gradient-to-r from-brand-400 to-brand-600 animate-pulse" 
              : job?.status === "completed"
              ? "bg-success-500"
              : job?.status === "failed"
              ? "bg-danger-500"
              : "bg-sand-300"
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
      <div className="">
        <h4 className="">📊 Resultados del análisis</h4>
        <div className="">
          <div>
            <span>Menciones detectadas:</span>
            <span className="">{matches}</span>
          </div>
          <div>
            <span>Clasificadas:</span>
            <span className="">{classified}</span>
          </div>
          <div>
            <span>Confianza promedio:</span>
            <span className="">{Math.round(averageConfidence)}%</span>
          </div>
        </div>
      </div>
    );
  };

  if (!job) {
    return (
      <div className="">
        <Button className="w-full" size="lg" onClick={() => startProcessing(false)}>
          Iniciar detección de menciones
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className=""
          onClick={() => startProcessing(true)}
        >
          Forzar reproceso
        </Button>
        <p className="">
          Analiza la transcripción en busca de menciones de terapia y salud mental.
        </p>
      </div>
    );
  }

  return (
    <div className="">
      {/* Status Header */}
      <div className={`rounded-2xl border px-4 py-4 ${getStatusColor(job.status)}`}>
        <div className="">
          <div>
            <h3 className="">
              {job.status === "pending" && "🔄 Inicializando..."}
              {job.status === "running" && "🤖 Procesando menciones"}
              {job.status === "completed" && "✅ Análisis completado"}
              {job.status === "failed" && "❌ Error en el procesamiento"}
            </h3>
            {job.currentStep && (
              <p className="">
                {STEP_DESCRIPTIONS[job.currentStep as keyof typeof STEP_DESCRIPTIONS] || job.currentStep}
              </p>
            )}
          </div>
          
          <div className="">
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
        <div className="">
          {renderProgressBar()}
          <div className="">
            <span>{getProgressPercentage()}%</span>
            <span>
              {job.status === "completed" 
                ? "Procesamiento completo" 
                : job.status === "running"
                ? "En progreso..."
                : job.status === "failed"
                ? "Falló"
                : "Pendiente"}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {job.status === "failed" && job.errorMessage && (
        <div className="">
          <strong>Error:</strong> {job.errorMessage}
        </div>
      )}

      {/* Results */}
      {renderResults()}

      {/* Action Buttons */}
      <div className="">
        {(job.status === "failed" || job.status === "completed") && (
          <Button
            variant="secondary"
            onClick={() => startProcessing(true)}
            className=""
          >
            🔄 Reprocesar
          </Button>
        )}
        
        {job.status === "running" && (
          <Button
            disabled
            variant="ghost"
            className=""
          >
            ⏳ Procesando...
          </Button>
        )}
      </div>
    </div>
  );
}
