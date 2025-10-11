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
    setValue,
  } = useForm<ScanFormData>({
    resolver: zodResolver(ScanFormSchema),
    defaultValues: {
      scanFrequency: "weekly",
    },
  });

  const watchedUrl = watch("youtubeUrl");
  const watchedScanFrequency = watch("scanFrequency");

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
    <div className={`space-y-6 ${className}`}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* YouTube URL Input */}
        <div>
          <label
            htmlFor="youtubeUrl"
            className="block text-sm font-semibold text-gray-900 mb-3"
          >
            URL de YouTube
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🎥</span>
            </div>
            <input
              {...register("youtubeUrl")}
              type="url"
              id="youtubeUrl"
              placeholder="https://www.youtube.com/@username"
              className={`input pl-12 pr-4 py-3 text-base ${
                errors.youtubeUrl ? "input-error" : ""
              } ${isLoading ? "opacity-50" : ""}`}
              disabled={isLoading}
            />
          </div>
          {errors.youtubeUrl && (
            <p className="mt-2 text-sm text-error-600">
              {errors.youtubeUrl.message}
            </p>
          )}
          
          {/* URL Preview */}
          {urlPreview && (
            <div className="mt-4 p-4 bg-gradient-to-r from-brand-light/20 to-brand-blue/20 border border-brand-light/30 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  urlType === "channel"
                    ? "bg-success-100 text-success-800 border border-success-200"
                    : urlType === "playlist"
                    ? "bg-info-100 text-info-800 border border-info-200"
                    : "bg-warning-100 text-warning-800 border border-warning-200"
                }`}>
                  {urlType === "channel" && "📺 Canal"}
                  {urlType === "playlist" && "📂 Playlist"}
                  {urlType === "video" && "🎥 Video"}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {urlType === "channel" && "Canal detectado"}
                  {urlType === "playlist" && "Playlist detectada"}
                  {urlType === "video" && "Video detectado"}
                </span>
              </div>
              <p className="text-xs text-gray-600 font-mono break-all">
                {urlPreview}
              </p>
            </div>
          )}
        </div>

        {/* Scan Frequency */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Frecuencia de escaneo
          </label>
          <div className="space-y-3">
            {[
              {
                value: "daily",
                title: "Diario",
                description: "Verifica nuevos episodios todos los días",
                icon: "📅",
                recommended: false
              },
              {
                value: "weekly", 
                title: "Semanal",
                description: "Verifica nuevos episodios semanalmente (recomendado)",
                icon: "📊",
                recommended: true
              },
              {
                value: "manual",
                title: "Manual",
                description: "Solo escanea cuando se active manualmente",
                icon: "👆",
                recommended: false
              }
            ].map((option) => (
              <label
                key={option.value}
                className="relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover-lift"
                style={{
                  borderColor: watchedScanFrequency === option.value ? 'var(--tw-ring-color)' : 'transparent',
                  backgroundColor: watchedScanFrequency === option.value ? 'rgb(59 130 246 / 0.05)' : 'transparent'
                }}
                onClick={() => setValue("scanFrequency", option.value as any)}
              >
                <input
                  {...register("scanFrequency")}
                  type="radio"
                  value={option.value}
                  className="sr-only"
                  disabled={isLoading}
                  checked={watchedScanFrequency === option.value}
                />
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    watchedScanFrequency === option.value
                      ? "bg-primary-500 border-primary-500"
                      : "bg-white border-gray-300"
                  }`}>
                    {watchedScanFrequency === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{option.icon}</span>
                    <p className="font-medium text-gray-900">{option.title}</p>
                    {option.recommended && (
                      <span className="badge badge-success text-xs">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.scanFrequency && (
            <p className="mt-2 text-sm text-error-600">
              {errors.scanFrequency.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`btn-primary text-base px-6 py-3 font-semibold shadow-lg micro-bounce ${
              !isValid || isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="spinner w-4 h-4"></div>
                <span>Agregando fuente...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>🔍</span>
                <span>Agregar fuente</span>
              </div>
            )}
          </button>
        </div>
      </form>

      {/* Example URLs */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>💡</span>
          <span>Ejemplos de URLs</span>
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-400">📺</span>
            <div>
              <p className="text-xs font-medium text-gray-700">Canal</p>
              <p className="text-xs text-gray-500 font-mono">
                youtube.com/@username
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-400">📂</span>
            <div>
              <p className="text-xs font-medium text-gray-700">Playlist</p>
              <p className="text-xs text-gray-500 font-mono">
                youtube.com/playlist?list=...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-400">🎥</span>
            <div>
              <p className="text-xs font-medium text-gray-700">Video</p>
              <p className="text-xs text-gray-500 font-mono">
                youtube.com/watch?v=...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScanInputForm;