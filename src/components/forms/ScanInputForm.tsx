"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  parseYouTubeUrl,
  isValidYouTubeUrl,
  normalizeYouTubeUrl,
} from "../../lib/youtube-parser";

// Form schema
const ScanFormSchema = z.object({
  youtubeUrl: z
    .string()
    .min(1, "YouTube URL is required")
    .refine((url) => isValidYouTubeUrl(url), {
      message: "Please enter a valid YouTube channel, playlist, or video URL",
    }),
  scanFrequency: z.enum(["daily", "weekly", "manual"], {
    message: "Please select a scan frequency",
  }),
});

type ScanFormData = z.infer<typeof ScanFormSchema>;

interface ScanInputFormProps {
  onSubmit: (data: {
    url: string;
    type: "channel" | "playlist" | "video";
    scanFrequency: "daily" | "weekly" | "manual";
  }) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function ScanInputForm({
  onSubmit,
  isLoading = false,
  className = "",
}: ScanInputFormProps) {
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const [urlType, setUrlType] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<ScanFormData>({
    resolver: zodResolver(ScanFormSchema),
    defaultValues: {
      scanFrequency: "weekly",
    },
  });

  const watchedUrl = watch("youtubeUrl");

  // Update preview when URL changes
  React.useEffect(() => {
    if (watchedUrl && isValidYouTubeUrl(watchedUrl)) {
      const parsed = parseYouTubeUrl(watchedUrl);
      if (parsed) {
        setUrlPreview(normalizeYouTubeUrl(watchedUrl));
        setUrlType(parsed.type);
      }
    } else {
      setUrlPreview(null);
      setUrlType(null);
    }
  }, [watchedUrl]);

  const onFormSubmit = async (data: ScanFormData) => {
    const parsed = parseYouTubeUrl(data.youtubeUrl);
    if (!parsed) {
      return;
    }

    await onSubmit({
      url: data.youtubeUrl,
      type: parsed.type,
      scanFrequency: data.scanFrequency,
    });

    reset();
    setUrlPreview(null);
    setUrlType(null);
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white shadow-sm rounded-lg border p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Add YouTube Source
          </h2>
          <p className="text-sm text-gray-600">
            Enter a YouTube channel, playlist, or video URL to start scanning
            for therapy and mental health mentions.
          </p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* YouTube URL Input */}
          <div>
            <label
              htmlFor="youtubeUrl"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              YouTube URL
            </label>
            <input
              {...register("youtubeUrl")}
              type="url"
              id="youtubeUrl"
              placeholder="https://www.youtube.com/channel/UC... or https://www.youtube.com/@username"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.youtubeUrl ? "border-red-300" : ""
              }`}
              disabled={isLoading}
            />
            {errors.youtubeUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.youtubeUrl.message}
              </p>
            )}
            
            {/* URL Preview */}
            {urlPreview && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    urlType === "channel"
                      ? "bg-green-100 text-green-800"
                      : urlType === "playlist"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {urlType === "channel" && "📺 Channel"}
                    {urlType === "playlist" && "📂 Playlist"}
                    {urlType === "video" && "🎥 Video"}
                  </div>
                  <span className="text-sm text-gray-600">
                    Detected {urlType}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700 font-mono break-all">
                  {urlPreview}
                </p>
              </div>
            )}
          </div>

          {/* Scan Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan Frequency
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  {...register("scanFrequency")}
                  type="radio"
                  value="daily"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  <strong>Daily</strong> - Check for new episodes daily
                </span>
              </label>
              <label className="flex items-center">
                <input
                  {...register("scanFrequency")}
                  type="radio"
                  value="weekly"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  <strong>Weekly</strong> - Check for new episodes weekly (recommended)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  {...register("scanFrequency")}
                  type="radio"
                  value="manual"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  <strong>Manual</strong> - Only scan when manually triggered
                </span>
              </label>
            </div>
            {errors.scanFrequency && (
              <p className="mt-1 text-sm text-red-600">
                {errors.scanFrequency.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isValid && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding Source...
                </div>
              ) : (
                "Add Source"
              )}
            </button>
          </div>
        </form>

        {/* Example URLs */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Example URLs:
          </h3>
          <div className="space-y-2 text-xs text-gray-500">
            <div>
              <strong>Channel:</strong> https://www.youtube.com/@username or
              https://www.youtube.com/channel/UC...
            </div>
            <div>
              <strong>Playlist:</strong> https://www.youtube.com/playlist?list=PL...
            </div>
            <div>
              <strong>Video:</strong> https://www.youtube.com/watch?v=...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScanInputForm;