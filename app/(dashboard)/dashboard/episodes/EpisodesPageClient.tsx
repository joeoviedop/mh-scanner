"use client";

import React from "react";

import { EpisodeList } from "@/src/components/episodes/EpisodeList";
import { TranscriptViewer } from "@/src/components/episodes/TranscriptViewer";

type Episode = {
  _id: string;
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: number;
  duration: string;
  durationSeconds: number;
  thumbnailUrl?: string;
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  hasTranscription: boolean;
  transcriptionFetchedAt?: number | null;
  transcriptionError?: string | null;
  hasBeenProcessed: boolean;
  hasMentions: boolean;
  mentionCount: number;
  averageConfidence?: number;
  status: "discovered" | "transcribing" | "processing" | "completed" | "error" | "skipped";
};

type Fragment = {
  _id: string;
  text: string;
  context: string;
  startTime: number;
  endTime: number;
  detectedAt: number;
  youtubeUrl: string;
  classification: {
    tema: string;
    tono: string;
    confianza: number;
    sensibilidad: string[];
    razon?: string;
  };
};

interface Props {
  initialEpisodes: Episode[];
}

export default function EpisodesPageClient({ initialEpisodes }: Props) {
  const [episodes, setEpisodes] = React.useState<Episode[]>(initialEpisodes);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fetchingIds, setFetchingIds] = React.useState<string[]>([]);
  const [detectingIds, setDetectingIds] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = React.useState<string | null>(null);
  const [fragments, setFragments] = React.useState<Fragment[]>([]);
  const [fragmentsLoading, setFragmentsLoading] = React.useState(false);
  const [viewingTranscriptId, setViewingTranscriptId] = React.useState<string | null>(null);

  const selectedEpisode = React.useMemo(() => {
    if (!selectedEpisodeId) return null;
    return episodes.find((episode) => episode._id === selectedEpisodeId) ?? null;
  }, [episodes, selectedEpisodeId]);

  const refreshEpisodes = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/episodes", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to refresh episodes");
      }

      setEpisodes(data.episodes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh episodes";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFragments = React.useCallback(async (episode: Episode) => {
    setFragmentsLoading(true);
    setError(null);
    setFragments([]);

    try {
      const response = await fetch(`/api/episodes/${episode._id}/fragments`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to load fragments");
      }

      setFragments(data.fragments);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load fragments";
      setError(message);
      setFragments([]);
    } finally {
      setFragmentsLoading(false);
    }
  }, []);

  const handleFetchTranscription = React.useCallback(
    async (episode: Episode) => {
      setError(null);
      setStatusMessage(null);
      setFetchingIds((prev) => [...new Set([...prev, episode._id])]);

      try {
        const response = await fetch("/api/youtube/fetch-captions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ episodeId: episode._id }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Failed to fetch transcript");
        }

        if (data.result?.status === "completed") {
          setStatusMessage("Transcript fetched successfully.");
        } else if (data.result?.status === "queued") {
          setStatusMessage("Transcription already in progress.");
        } else if (data.result?.status === "skipped") {
          setStatusMessage("Episode already has a transcript.");
        } else {
          setStatusMessage("Transcription request submitted.");
        }

        await refreshEpisodes();

        if (selectedEpisodeId && selectedEpisodeId === episode._id) {
          await loadFragments(episode);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch transcript";
        setError(message);
      } finally {
        setFetchingIds((prev) => prev.filter((id) => id !== episode._id));
      }
    },
    [refreshEpisodes, loadFragments, selectedEpisodeId]
  );

  const handleDetectMentions = React.useCallback(
    async (episode: Episode) => {
      setError(null);
      setStatusMessage(null);
      setDetectingIds((prev) => [...new Set([...prev, episode._id])]);

      try {
        const response = await fetch("/api/process/detect-mentions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ episodeId: episode._id }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Failed to detect mentions");
        }

        if (data.result?.status === "completed") {
          setStatusMessage("Detección de menciones completada.");
        } else if (data.result?.status === "queued") {
          setStatusMessage("Ya hay una detección en proceso.");
        } else if (data.result?.status === "skipped") {
          setStatusMessage("No se pudo ejecutar la detección en este momento.");
        }

        await refreshEpisodes();

        if (selectedEpisodeId && selectedEpisodeId === episode._id) {
          await loadFragments(episode);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to detect mentions";
        setError(message);
      } finally {
        setDetectingIds((prev) => prev.filter((id) => id !== episode._id));
      }
    },
    [refreshEpisodes, loadFragments, selectedEpisodeId]
  );

  const handleEpisodeClick = React.useCallback(
    async (episode: Episode) => {
      setSelectedEpisodeId(episode._id);
      await loadFragments(episode);
    },
    [loadFragments]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Episodes</h1>
          <p className="text-sm text-slate-600">Manage transcripts and detected mentions.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={refreshEpisodes}
          disabled={isLoading}
        >
          🔄 Refresh
        </button>
      </div>

      {statusMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <EpisodeList
        episodes={episodes}
        isLoading={isLoading}
        onEpisodeClick={handleEpisodeClick}
        onFetchTranscription={handleFetchTranscription}
        fetchingTranscriptionIds={fetchingIds}
        onDetectMentions={handleDetectMentions}
        detectingMentionIds={detectingIds}
        onViewTranscript={(episode) => setViewingTranscriptId(episode._id)}
        showChannel
      />

      {selectedEpisode && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Fragments for: {selectedEpisode.title}</h2>
              <p className="text-sm text-slate-600">
                {fragmentsLoading
                  ? "Loading fragments..."
                  : fragments.length === 0
                  ? "No fragments detected yet."
                  : `${fragments.length} fragment${fragments.length === 1 ? "" : "s"} detected.`}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Status: {selectedEpisode.status}</span>
              <span>•</span>
              <span>{selectedEpisode.hasTranscription ? "Transcript ready" : "No transcript"}</span>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {fragments.map((fragment) => (
              <article key={fragment._id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <header className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase text-slate-500">
                  <span>{fragment.classification.tema}</span>
                  <span>•</span>
                  <span>{fragment.classification.tono}</span>
                  <span>•</span>
                  <span>{fragment.classification.confianza}% confianza</span>
                  {fragment.classification.sensibilidad
                    .filter((label) => label !== "ninguna")
                    .map((label) => (
                      <span key={label} className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
                        {label}
                      </span>
                    ))}
                </header>
                <p className="mt-3 text-sm text-slate-900">{fragment.text}</p>
                <p className="mt-2 text-xs text-slate-600">
                  Contexto: <span className="font-medium">{fragment.context}</span>
                </p>
                <footer className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <a
                    href={fragment.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ver en YouTube
                  </a>
                  <span>
                    Tiempo: {fragment.startTime}s - {fragment.endTime}s
                  </span>
                  <span>Detectado: {new Date(fragment.detectedAt).toLocaleString()}</span>
                  {fragment.classification.razon && <span>Motivo: {fragment.classification.razon}</span>}
                </footer>
              </article>
            ))}
          </div>
        </div>
      )}
      
      {/* Transcript Viewer Modal */}
      {viewingTranscriptId && (
        <TranscriptViewer
          episodeId={viewingTranscriptId}
          onClose={() => setViewingTranscriptId(null)}
        />
      )}
    </div>
  );
}
