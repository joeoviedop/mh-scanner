"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";


interface Episode {
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
}

interface EpisodeListProps {
  episodes: Episode[];
  isLoading?: boolean;
  error?: string;
  onEpisodeClick?: (episode: Episode) => void;
  showChannel?: boolean;
  onFetchTranscription?: (episode: Episode) => void;
  fetchingTranscriptionIds?: string[];
  onDetectMentions?: (episode: Episode) => void;
  detectingMentionIds?: string[];
  className?: string;
}

type StatusVariant = {
  label: string;
  badgeVariant: React.ComponentProps<typeof Badge>["variant"];
  tone?: "neutral" | "warning" | "danger" | "success";
};

const STATUS_VARIANTS: Record<Episode["status"], StatusVariant> = {
  discovered: { label: "Descubierto", badgeVariant: "neutral", tone: "neutral" },
  transcribing: { label: "Transcribiendo", badgeVariant: "warning", tone: "warning" },
  processing: { label: "Procesando", badgeVariant: "warning", tone: "warning" },
  completed: { label: "Completado", badgeVariant: "success", tone: "success" },
  error: { label: "Error", badgeVariant: "danger", tone: "danger" },
  skipped: { label: "Omitido", badgeVariant: "outline", tone: "neutral" },
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatNumber(num?: string): string {
  if (!num) return "N/A";
  const number = Number(num);
  if (Number.isNaN(number)) return num;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return number.toString();
}

export function EpisodeList({
  episodes,
  isLoading = false,
  error,
  onEpisodeClick,
  showChannel = true,
  onFetchTranscription,
  fetchingTranscriptionIds = [],
  onDetectMentions,
  detectingMentionIds = [],
  _className = "",
}: EpisodeListProps) {
  if (error) {
    return (
      <Card _className={""}>
        <p _className="">Error al cargar episodios</p>
        <p _className="">{error}</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div _className={""}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card
            key={`episode-skeleton-${index}`}
            _className=""
          >
            <div _className="" />
            <div _className="">
              <div _className="" />
              <div _className="" />
              <div _className="" />
              <div _className="" />
              <div _className="" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <Card _className={""}>
        <div _className="">
          🎧
        </div>
        <p _className="">No hay episodios aún</p>
        <p _className="">
          Agrega fuentes de YouTube para comenzar a escanear episodios y detectar menciones relevantes.
        </p>
      </Card>
    );
  }

  return (
    <div _className={""}>
      {episodes.map((episode) => {
        const status = STATUS_VARIANTS[episode.status];
        const isFetchingTranscript =
          fetchingTranscriptionIds.includes(episode._id) || episode.status === "transcribing";
        const isDetectingMentions =
          detectingMentionIds.includes(episode._id) || episode.status === "processing";

        return (
          <article
            key={episode._id}
            _className={""}
            onClick={() => onEpisodeClick?.(episode)}
          >
            <div _className="">
              {episode.thumbnailUrl ? (
                <Image
                  src={episode.thumbnailUrl}
                  alt={episode.title}
                  fill
                  sizes="(min-width: 1280px) 340px, (min-width: 768px) 50vw, 100vw"
                  _className=""
                />
              ) : (
                <div _className="">
                  🎧
                </div>
              )}

              <div _className="">
                <Badge variant={status.badgeVariant} _className="">
                  {status.label}
                </Badge>
                {episode.hasMentions ? (
                  <span _className="">
                    {episode.mentionCount} fragmento{episode.mentionCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>

            <div _className="">
              <div _className="">
                <h3 _className="">
                  {episode.title}
                </h3>
                {showChannel ? (
                  <p _className="">{episode.channelTitle}</p>
                ) : null}
              </div>

              <div _className="">
                <span>{formatDistanceToNow(new Date(episode.publishedAt), { addSuffix: true })}</span>
                <span>•</span>
                <span>{formatDuration(episode.durationSeconds)}</span>
                {episode.viewCount ? (
                  <>
                    <span>•</span>
                    <span>{formatNumber(episode.viewCount)} vistas</span>
                  </>
                ) : null}
              </div>

              {episode.description ? (
                <p _className="">
                  {episode.description}
                </p>
              ) : null}

              <div _className="">
                {episode.hasTranscription ? (
                  <p _className="">
                    📝 Transcripción lista
                    {episode.transcriptionFetchedAt ? (
                      <span _className="">
                        {formatDistanceToNow(new Date(episode.transcriptionFetchedAt), { addSuffix: true })}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                {episode.hasBeenProcessed ? <p _className="">🔍 Procesado</p> : null}
                {episode.transcriptionError ? (
                  <p _className={""}>
                    ⚠️ {episode.transcriptionError}
                  </p>
                ) : null}
              </div>

              <div _className="">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  _className=""
                  onClick={(event) => event.stopPropagation()}
                >
                  <Link href={`https://www.youtube.com/watch?v=${episode.videoId}`} target="_blank">
                    Abrir en YouTube
                  </Link>
                </Button>

                {episode.hasMentions && onEpisodeClick ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEpisodeClick(episode);
                    }}
                  >
                    Ver fragmentos
                  </Button>
                ) : null}

                {onFetchTranscription && !episode.hasTranscription && episode.status !== "skipped" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFetchTranscription(episode);
                    }}
                    disabled={isFetchingTranscript}
                    isLoading={isFetchingTranscript}
                  >
                    {isFetchingTranscript ? "Solicitando…" : "Obtener transcripción"}
                  </Button>
                ) : null}

                {onFetchTranscription && episode.status === "error" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFetchTranscription(episode);
                    }}
                  >
                    Reintentar
                  </Button>
                ) : null}

                {episode.hasTranscription ? (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    _className=""
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Link href={`/dashboard/episodes/${episode._id}`}>Ver detalle</Link>
                  </Button>
                ) : null}

                {onDetectMentions && episode.hasTranscription ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDetectMentions(episode);
                    }}
                    disabled={isDetectingMentions}
                    isLoading={isDetectingMentions}
                  >
                    {isDetectingMentions ? "Detectando…" : "Detectar menciones"}
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default EpisodeList;
