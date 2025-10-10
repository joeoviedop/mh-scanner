"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";

// Types based on our Convex schema
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
  className?: string;
}

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
  const number = parseInt(num, 10);
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + "M";
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + "K";
  }
  return number.toString();
}

function getStatusColor(status: Episode["status"]) {
  switch (status) {
    case "discovered":
      return "bg-blue-100 text-blue-800";
    case "transcribing":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-orange-100 text-orange-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "error":
      return "bg-red-100 text-red-800";
    case "skipped":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusText(status: Episode["status"]) {
  switch (status) {
    case "discovered":
      return "📥 Discovered";
    case "transcribing":
      return "📝 Getting Transcript";
    case "processing":
      return "🔍 Processing";
    case "completed":
      return "✅ Completed";
    case "error":
      return "❌ Error";
    case "skipped":
      return "⏭️ Skipped";
    default:
      return status;
  }
}

export function EpisodeList({
  episodes,
  isLoading = false,
  error,
  onEpisodeClick,
  showChannel = true,
  className = "",
}: EpisodeListProps) {
  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Error loading episodes</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-40 h-24 bg-gray-200 rounded-md"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📺</div>
          <p className="text-lg font-medium">No episodes found</p>
          <p className="text-sm mt-2">
            Add some YouTube sources to start scanning for episodes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {episodes.map((episode) => (
        <div
          key={episode._id}
          className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
            onEpisodeClick ? "cursor-pointer" : ""
          }`}
          onClick={() => onEpisodeClick?.(episode)}
        >
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {episode.thumbnailUrl ? (
                <img
                  src={episode.thumbnailUrl}
                  alt={episode.title}
                  className="w-40 h-24 object-cover rounded-md"
                />
              ) : (
                <div className="w-40 h-24 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 text-2xl">🎥</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 line-clamp-2 leading-tight">
                    {episode.title}
                  </h3>
                  
                  {showChannel && (
                    <p className="text-sm text-gray-600 mt-1">
                      {episode.channelTitle}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(episode.publishedAt), { addSuffix: true })}
                    </span>
                    <span>{formatDuration(episode.durationSeconds)}</span>
                    {episode.viewCount && (
                      <span>{formatNumber(episode.viewCount)} views</span>
                    )}
                  </div>
                </div>

                {/* Status and Stats */}
                <div className="flex-shrink-0 space-y-2">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(episode.status)}`}>
                    {getStatusText(episode.status)}
                  </div>
                  
                  {/* Mention Stats */}
                  {episode.hasMentions && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {episode.mentionCount} mention{episode.mentionCount !== 1 ? "s" : ""}
                      </div>
                      {episode.averageConfidence && (
                        <div className="text-xs text-gray-500">
                          {episode.averageConfidence}% confidence
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Processing Indicators */}
                  <div className="text-right text-xs space-y-1">
                    {episode.hasTranscription && (
                      <div className="text-green-600">📝 Transcribed</div>
                    )}
                    {episode.hasBeenProcessed && (
                      <div className="text-blue-600">🔍 Processed</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description Preview */}
              {episode.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                  {episode.description}
                </p>
              )}

              {/* Quick Actions */}
              {onEpisodeClick && (
                <div className="flex items-center gap-2 mt-3">
                  <a
                    href={`https://www.youtube.com/watch?v=${episode.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 Open on YouTube
                  </a>
                  
                  {episode.hasMentions && (
                    <span className="text-xs text-gray-400">•</span>
                  )}
                  
                  {episode.hasMentions && (
                    <button
                      className="text-xs text-green-600 hover:text-green-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEpisodeClick(episode);
                      }}
                    >
                      👁️ View Mentions
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EpisodeList;