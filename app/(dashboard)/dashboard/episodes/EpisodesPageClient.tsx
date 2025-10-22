"use client";

import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

import { EpisodeList } from "@/components/episodes/EpisodeList";


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

const STATUS_FILTERS: Array<{ value: "all" | Episode["status"]; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "completed", label: "Completados" },
  { value: "processing", label: "Procesando" },
  { value: "transcribing", label: "Transcribiendo" },
  { value: "discovered", label: "Nuevos" },
  { value: "error", label: "Errores" },
];

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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | Episode["status"]>("all");
  const [mentionsFilter, setMentionsFilter] = React.useState<"all" | "with">("all");

  const selectedEpisode = React.useMemo(() => {
    if (!selectedEpisodeId) return null;
    return episodes.find((episode) => episode._id === selectedEpisodeId) ?? null;
  }, [episodes, selectedEpisodeId]);

  const filteredEpisodes = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return episodes.filter((episode) => {
      const matchesQuery =
        query.length === 0 ||
        [episode.title, episode.channelTitle, episode.description]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));

      const matchesStatus = statusFilter === "all" || episode.status === statusFilter;
      const matchesMentions = mentionsFilter === "all" || episode.hasMentions;

      return matchesQuery && matchesStatus && matchesMentions;
    });
  }, [episodes, searchTerm, statusFilter, mentionsFilter]);

  const filteredCount = filteredEpisodes.length;
  const totalCount = episodes.length;

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
    [refreshEpisodes, loadFragments, selectedEpisodeId],
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
    [refreshEpisodes, loadFragments, selectedEpisodeId],
  );

  const handleEpisodeClick = React.useCallback(
    async (episode: Episode) => {
      setSelectedEpisodeId(episode._id);
      await loadFragments(episode);
    },
    [loadFragments],
  );

  return (
    <div className="">
      <header className="">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/dashboard" },
            { label: "Episodios" },
          ]}
        />
        <div className="">
          <div className="">
            <div className="">
              <h1 className="">Episodios</h1>
              <p className="">
                Gestiona transcripciones, detección de menciones y prioriza qué revisar junto al equipo.
              </p>
            </div>
          </div>

          <div className="">
            <div className="">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className=""
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21 21-4.35-4.35" />
                <circle cx="11" cy="11" r="7" />
              </svg>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por título, canal o descripción…"
                className=""
              />
            </div>
            <div className="">
              {STATUS_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={""}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMentionsFilter((prev) => (prev === "with" ? "all" : "with"))}
                className={""}
              >
                Solo con menciones
              </button>
            </div>
          </div>
        </div>
      </header>

      {statusMessage ? (
        <div className="">
          {statusMessage}
        </div>
      ) : null}

      {error ? (
        <div className="">
          {error}
        </div>
      ) : null}

      <section className="">
        <div className="">
          <div>
            <h2 className="">Listado de episodios</h2>
            <p className="">
              Mostrando {filteredCount} de {totalCount} episodios sincronizados.
            </p>
          </div>
          <div className="">
            <Badge variant="outline" className="">
              Sincronizado con Convex
            </Badge>
            <Button variant="secondary" size="sm" onClick={refreshEpisodes} isLoading={isLoading}>
              Refrescar
            </Button>
          </div>
        </div>

        <EpisodeList
          episodes={filteredEpisodes}
          isLoading={isLoading}
          onEpisodeClick={handleEpisodeClick}
          onFetchTranscription={handleFetchTranscription}
          fetchingTranscriptionIds={fetchingIds}
          onDetectMentions={handleDetectMentions}
          detectingMentionIds={detectingIds}
          showChannel
        />
      </section>

      {selectedEpisode ? (
        <section className="">
          <div className="">
            <div className="">
              <h2 className="">Fragmentos detectados</h2>
              <p className="">
                {fragmentsLoading
                  ? "Cargando fragmentos…"
                  : fragments.length === 0
                  ? "Aún no hay fragmentos para este episodio."
                  : `${fragments.length} fragment${fragments.length === 1 ? "" : "os"} detectados.`}
              </p>
              <p className="">{selectedEpisode.title}</p>
            </div>
            <div className="">
              <Badge variant="outline" className="">
                {selectedEpisode.status}
              </Badge>
              <Badge variant={selectedEpisode.hasTranscription ? "success" : "neutral"}>
                {selectedEpisode.hasTranscription ? "Transcripción lista" : "Sin transcripción"}
              </Badge>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className=""
              >
                <Link href={`/dashboard/episodes/${selectedEpisode._id}`}>Abrir detalle</Link>
              </Button>
            </div>
          </div>

          <div className="">
            {fragmentsLoading ? (
              <div className="">
                Cargando fragmentos…
              </div>
            ) : (
              fragments.map((fragment) => (
                <article
                  key={fragment._id}
                  className=""
                >
                  <header className="">
                    <span>{fragment.classification.tema}</span>
                    <span>•</span>
                    <span>{fragment.classification.tono}</span>
                    <span>•</span>
                    <span>{fragment.classification.confianza}% confianza</span>
                    {fragment.classification.sensibilidad
                      .filter((label) => label !== "ninguna")
                      .map((label) => (
                        <Badge key={label} variant="warning" className="">
                          {label}
                        </Badge>
                      ))}
                  </header>
                  <p className="">{fragment.text}</p>
                  <p className="">
                    Contexto: <span className="">{fragment.context}</span>
                  </p>
                  <footer className="">
                    <a
                      href={fragment.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=""
                    >
                      Ver en YouTube
                    </a>
                    <span>
                      Tiempo: {fragment.startTime}s – {fragment.endTime}s
                    </span>
                    <span>{new Date(fragment.detectedAt).toLocaleString()}</span>
                    {fragment.classification.razon ? <span>Motivo: {fragment.classification.razon}</span> : null}
                  </footer>
                </article>
              ))
            )}
          </div>
        </section>
      ) : (
        <div className="">
          Selecciona un episodio para visualizar los fragmentos detectados.
        </div>
      )}
    </div>
  );
}
